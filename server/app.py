import os
import logging
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Depends, Header, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, firestore, auth
from anthropic import Anthropic
# from anthropic import anthro
from dotenv import load_dotenv
import numpy as np
from datetime import datetime
import json


load_dotenv()

logging.basicConfig(
    level = logging.INFO,
    format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="VaibeSync Recommendation API",
    description="API for user recommendation based on the user requirements and profile",
    version='1.0.0'
)


app.add_middleware(
    CORSMiddleware,
    allow_origins= ['*'],
    allow_credentials = True,
    allow_methods = ['*'],
    allow_headers=['*']
)

cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH')

try:
    firebase_admin.get_app()
    logger.info('Firebase already intitalized')
except ValueError:
    try:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        logger.info(f'Firebase initiliazed with credentials from: {cred_path}')
    except Exception as e:
        logger.info(f'failed to initiliase Firebase: {e}')
        raise ValueError(f'Failed to initilize Firebase with credentials at path: {cred_path}. Error: {e}')
    

db = firestore.client()

api_key = os.getenv('ANTHROPIC_API_KEY')
if not api_key:
    raise ValueError('Anthropic API key not found')
claude_client = Anthropic(api_key=api_key)
embedding_model = os.getenv('EMBEDDING_MODEL')


class RecommendationRequest(BaseModel):
    limit: Optional[int] = 10

class TextRequest(BaseModel):
    text: str
    limit: Optional[int] = 10

class ProfileUpdateRequest(BaseModel):
    user_id: str

class BatchRequest(BaseModel):
    limit: Optional[int] = 50
    since: Optional[str] = None


async def verify_firebase_token(authorization: str = Header(...)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail = 'Invalide authrorization header')
    token = authorization.split('Bearer '[1])

    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.error(f'token verification error: {e}')
        raise HTTPException(status_code=401, detail='Invalid token')
    
def generate_embedding(text: str) -> List[float]:
    """Generate an embedding vector for the given text"""
    try:
        # The correct way to call embeddings with the latest Anthropic SDK
        #FIXME claude does not support embeddings --> move to openAI model for the tiem being
        response = claude_client.embeddings.create(
            model="claude-3-haiku-20240307",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        logger.error(f"Error generating embedding: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating embedding: {str(e)}")
    
def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """compute cosine similarity"""
    a = np.array(vec_a)
    b = np.array(vec_b)

    return float(np.dot(a, b) / np.linalg.norm(a) * np.linalg.norm(b))

def create_profile_text(profile_data: Dict[str, Any]) -> str:
    """generate text based profiles for the users"""
    parts = []

    if profile_data.get('displayName'):
        parts.append(f'Name: {profile_data['displayName']}')
    
    if profile_data.get('bio'):
        parts.append(f'Bio: {profile_data['bio']}')
    
    if profile_data.get('location'):
        parts.append(f'location: {profile_data['location']}')

    if profile_data.get('interests') and len(profile_data['interests']) > 0:
        parts.append(f'interests: {', '.join(profile_data['interests'])}')
    
    return '\n'.join(parts)

def create_activity_text(activity_data: Dict[str, Any]) -> str:
    """Create text representation of activity"""
    parts = []
    
    if activity_data.get("title"):
        parts.append(f"Title: {activity_data['title']}")
    
    if activity_data.get("category"):
        parts.append(f"Category: {activity_data['category']}")
    
    if activity_data.get("description"):
        parts.append(f"Description: {activity_data['description']}")
    
    if activity_data.get("location"):
        parts.append(f"Location: {activity_data['location']}")
    
    return "\n".join(parts)

async def update_profile_embedding_task(user_id: str) -> None:
    """background task to update a users' profile embeddings"""

    try:
        user_doc = db.collection('users').document(user_id).get()
        if not user_doc.exists:
            logger.error(f'user profile not found for {user_id}')
            return
        
        profile_data = user_doc.to_dict()

        profile_text = create_profile_text(profile_data)

        embedding = generate_embedding(profile_text)

        db.collection('userEmbeddings').document(user_id).set({
            'userId': user_id,
            'embedding': embedding,
            'updateAt': datetime.now().isoformat(),
            'profileSnapshot':{
                'interests': profile_data.get('interest', []),
                'bio': profile_data.get('bio', ''),
                'location': profile_data.get('location', '')
            }
        })

        logger.info(f'updated profile emnedding for user {user_id}')

    except Exception as e:
        logger.error(f"error eupdating user embedding profile {e}")

async def update_activity_embedding_task(activity_id: str) -> None:
    """Background task to update an activity's embedding"""
    try:
        # Get activity data
        activity_doc = db.collection("activities").document(activity_id).get()
        if not activity_doc.exists:
            logger.error(f"Activity not found: {activity_id}")
            return
        
        activity_data = activity_doc.to_dict()
        
        # Create text representation
        activity_text = create_activity_text(activity_data)
        
        # Generate embedding
        embedding = generate_embedding(activity_text)
        
        # Store in Firestore
        db.collection("activityEmbeddings").document(activity_id).set({
            "activityId": activity_id,
            "embedding": embedding,
            "updatedAt": datetime.now().isoformat(),
            "activitySnapshot": {
                "title": activity_data.get("title", ""),
                "description": activity_data.get("description", ""),
                "category": activity_data.get("category", ""),
                "location": activity_data.get("location", "")
            }
        })
        
        logger.info(f"Updated activity embedding for activity {activity_id}")
    except Exception as e:
        logger.error(f"Error updating activity embedding: {e}")


#API routes

@app.get('/')
async def root():
    return {'message': 'VaibeSync Recommendations API powered by Claude'}

@app.get('/health')
async def health_check():
    return {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'model': embedding_model,
        'firebase_initialized': True
    }


@app.post('/recommendations/activities')
async def get_activity_recommendations(
    request: RecommendationRequest,
    token_data: dict = Depends(verify_firebase_token)
):
    """get personlised activity recommendations based on user profile"""
    user_id =  token_data['uid']

    try:
        user_doc = db.collection('userEmbeddings').document(user_id).get()

        if not user_doc.exists:
            logger.warning(f'no embedding found for user {user_id}')
            return {'results': []}
        
        user_data = user_doc.to_dict()
        user_embedding = user_data['embedding']

        activities = db.collection('activityEmbeddings').stream()

        matches = []
        #TODO not a good method to identify close embeddings --> need to replace with ANN service like FAISS
        #FIXME currently O(n2)
        for activity_doc in activities:
            activity_data = activity_doc.to_dict()

            if 'emedding' not in activity_data or 'acitivitySnapshot' not in activity_data:
                continue

            similarity = cosine_similarity(user_embedding, activity_data['embedding'])

            matches.append({
                'activityId': activity_data['activityID'],
                'similarity': similarity,
                'activitySnapshot': activity_data['activitySnapshot']
            })

        matches.sort(key = lambda x: x['similarity'], reverse=True)
        matches = matches[:request.limit]

        return {'matches': matches}
    
    except Exception as e:
        logger.error(f'error getting recommendations: {e}')
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post('/recommendations/text')
async def get_recommendations_by_text(
    request: TextRequest,
    token_data: dict = Depends(verify_firebase_token)
):
    """get activity recommendations based on NLU"""
    try:
        # Generate embedding for query text
        query_embedding = generate_embedding(request.text)
        
        # Get all activity embeddings
        activities = db.collection("activityEmbeddings").stream()
        
        # Calculate similarities
        matches = []
        for activity_doc in activities:
            activity_data = activity_doc.to_dict()
            
            # Skip activities without proper data
            if "embedding" not in activity_data or "activitySnapshot" not in activity_data:
                continue
                
            # Calculate similarity
            similarity = cosine_similarity(query_embedding, activity_data["embedding"])
            
            matches.append({
                "activityId": activity_data["activityId"],
                "similarity": similarity,
                "activitySnapshot": activity_data["activitySnapshot"]
            })
        
        # Sort by similarity (highest first) and limit results
        matches.sort(key=lambda x: x["similarity"], reverse=True)
        matches = matches[:request.limit]
        
        return {"results": matches}
    except Exception as e:
        logger.error(f"Error getting recommendations by text: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    

@app.post('/recommendations/analyze')
async def  analyze_text(
    request: TextRequest,
    token_data: dict = Depends(verify_firebase_token)
):
    """analyse input text using Claude to extract structured information"""
    try:
        prompt = f"""
        Based on this text, extract key interests, preferences, and requirements from the user. Try to understand the user like you are a professional 
        counselor and are responisble for recommendinf users with brilliant recommendations.
        Format your reponse as JSON with the following fields:
        - interests: array of identified interests
        - preferences: object with prefences like location, time, group size
        - requirements: array of any hard requirements
        - sentiment: object with key aspect and sentiments (positive, negative, neutral)

        Here's the text:
        {request.text}
        respond only with JSON, no other text
        """
        response = claude_client.messages.create(
            model=embedding_model,
            max_tokens=1000,
            temperature=0,
            system='you extract structured information from text, by digging deep into user requirements. Respond only with JSON.',
            messages=[{'role':'user', 'content': prompt}]
        )

        try:
            response_text = response.construct[0].text
            return {'analysis': json.loads(response_text)}
        except json.JSONDecodeError:
            logger.error('Failed to parse JSON from claude response')
            return {
                "analysis": {
                    "interests": [],
                    "preferences": {},
                    "requirements": [],
            
                    "sentiment": {"overall": "neutral"}
            }
            }
    except Exception as e:
        logger.errot(f'error analysing text: {e}')
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/recommendations/update-profile")
async def update_profile_embedding(
    request: ProfileUpdateRequest,
    background_tasks: BackgroundTasks,
    token_data: dict = Depends(verify_firebase_token)
):
    """Update the embedding for a user profile"""
    # Verify user is updating their own profile or is an admin
    user_id = token_data["uid"]
    is_admin = token_data.get("admin", False)
    
    if user_id != request.user_id and not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to update this profile")
    
    # Get user profile data
    user_doc = db.collection("users").document(request.user_id).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    # Schedule the embedding update as a background task
    background_tasks.add_task(update_profile_embedding_task, request.user_id)
    
    return {
        "success": True,
        "message": "Profile embedding update scheduled"
    }

@app.post('recommendations/generate-all-embeddings')
async def generate_all_embeddings(
    background_tasks: BackgroundTasks,
    token_data: dict = Depends(verify_firebase_token)
):
    """generating embeddings for all the activites and users (can only be an admin task)"""
    is_admin = token_data.get('admin', False)
    if not is_admin:
        #FIXME need to add the admin check and resie http error if admin not there
        pass
    try:
        users = db.collection('users').stream()
        user_count = 0
        for user in users:
            user_id = user.id
            user_data= user.to_dict()
            background_tasks.add_task(update_profile_embedding, user_id)
            user_count += 1

        activities = db.collection('activities').stream()
        activity_count = 0

        for activity in activities:
            activity_id = activity.id
            activity_data = activity.to_dict()
            background_tasks.add_task(update_activity_embedding_task, activity_id)
            activity_count += 1
        return {
            'success': True,
            'message': 'embedding generate for users and activities in the DB',
            'user_count': user_count,
            'activity_count': activity_count
        }
    except Exception as e:
        logger.error(f'could not generate embeddings for user and activities : {str(e)}')
        raise HTTPException(status_code=500, detail=str(e))
    

        


@app.post("/recommendations/generate-embeddings-test")
async def generate_embeddings_test(background_tasks: BackgroundTasks):
    """Generate embeddings without authentication (for testing only)"""
    try:
        # Process all users
        users = db.collection("users").stream()
        user_count = 0
        
        for user_doc in users:
            user_id = user_doc.id
            user_data = user_doc.to_dict()
            background_tasks.add_task(update_profile_embedding_task, user_id)
            user_count += 1
        
        # Process all activities
        activities = db.collection("activities").stream()
        activity_count = 0
        
        for activity_doc in activities:
            activity_id = activity_doc.id
            background_tasks.add_task(update_activity_embedding_task, activity_id)
            activity_count += 1
        
        return {
            "success": True,
            "message": "Embedding generation started",
            "user_count": user_count,
            "activity_count": activity_count
        }
    except Exception as e:
        logger.error(f"Error in embedding generation: {e}")
        return {"success": False, "error": str(e)}
    

@app.post("/recommendations/batch-process")
async def batch_process_embeddings(
    request: BatchRequest,
    background_tasks: BackgroundTasks,
    token_data: dict = Depends(verify_firebase_token),
    
):
    """Batch process profiles and activities (admin only)"""
    # Verify admin access
    is_admin = token_data.get("admin", False)
    if not is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Process user profiles
        profile_count = 0
        query = db.collection("users")
        
        if request.since:
            try:
                since_date = datetime.fromisoformat(request.since)
                query = query.where("updatedAt", ">=", since_date)
            except ValueError:
                logger.warning(f"Invalid date format: {request.since}")
        
        if request.limit:
            query = query.limit(request.limit)
        
        users = query.stream()
        
        for user_doc in users:
            background_tasks.add_task(update_profile_embedding_task, user_doc.id)
            profile_count += 1
        
        # Process activities
        activity_count = 0
        query = db.collection("activities")
        
        if request.since:
            try:
                since_date = datetime.fromisoformat(request.since)
                query = query.where("updatedAt", ">=", since_date)
            except ValueError:
                pass  # Already logged above
        
        if request.limit:
            query = query.limit(request.limit)
        
        activities = query.stream()
        
        for activity_doc in activities:
            background_tasks.add_task(update_activity_embedding_task, activity_doc.id)
            activity_count += 1
        
        return {
            "success": True,
            "message": "Batch processing scheduled",
            "profile_count": profile_count,
            "activity_count": activity_count
        }
    except Exception as e:
        logger.error(f"Error in batch processing: {e}")
        raise HTTPException(status_code=500, detail=str(e))   




    
if __name__ == '__main__':
    import uvicorn
    uvicorn.run('app:app', host = '127.0.0.1', port = 8000, reload=True)


#TODO --> use the existing user profile to generate the user embeddings instead to doing so in the recommended tab
#TODO --> batch process all the activities to generate the embeddings
#TODO --> split the recommended tab into sers recommended + activities recommeneded
#TODO add the questionnaire in the recommend tab to enhance recommendations

#questions about the flow -- need to upnderstand every bit of it
#where are the embeddings getting stored?
#recommend users to match with the profile
#how to create my own LLM or recommender model
#training process?
#what dataset can I use ?
