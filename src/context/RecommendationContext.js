// src/context/RecommendationContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import { 
  doc,
  collection, 
  getDocs, 
  query, 
  orderBy,
  limit,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { checkOnlineStatus } from '../utils/network';

// Create context
const RecommendationContext = createContext();

export const RecommendationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [recommendedActivities, setRecommendedActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch recommended activities when the user changes
  useEffect(() => {
    if (currentUser) {
      fetchRecommendedActivities();
    } else {
      setRecommendedActivities([]);
    }
  }, [currentUser]);

  /**
   * Fetch recommended activities based on user interests
   * This is a simplified version that matches categories to user interests
   * Will be enhanced with the Claude API integration
   */
  const fetchRecommendedActivities = async () => {
    if (!currentUser) return [];
    
    try {
      setLoading(true);
      setError(null);
      
      // Check if we're online
      const isOnline = await checkOnlineStatus();
      if (!isOnline) {
        setError('Cannot get recommendations while offline');
        setLoading(false);
        return [];
      }
      
      // Get user profile for interests
      const userRef = doc(db, 'users', currentUser.uid);
      const userProfile = await userRef.get();
      
      if (!userProfile.exists()) {
        setRecommendedActivities([]);
        setLoading(false);
        return [];
      }
      
      const userData = userProfile.data();
      const userInterests = userData.interests || [];
      
      if (userInterests.length === 0) {
        // No interests, show random activities
        const activitiesQuery = query(
          collection(db, 'activities'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        
        const activitiesSnapshot = await getDocs(activitiesQuery);
        const activityList = [];
        
        activitiesSnapshot.forEach((doc) => {
          activityList.push({
            id: doc.id,
            ...doc.data(),
            similarity: 0.5, // Default similarity
          });
        });
        
        setRecommendedActivities(activityList);
        setLoading(false);
        return activityList;
      }
      
      // With interests, try to find matching activities
      // This is a simplified version - will be replaced with embedding-based similarity
      let activitiesQuery = query(
        collection(db, 'activities'),
        where('category', 'in', userInterests.slice(0, 10)), // Firestore limits 'in' queries to 10 values
        limit(20)
      );
      
      const activitiesSnapshot = await getDocs(activitiesQuery);
      const activityList = [];
      
      activitiesSnapshot.forEach((doc) => {
        const activityData = doc.data();
        const activity = {
          id: doc.id,
          ...activityData,
          // Simple similarity calculation based on category matching
          // Will be replaced with actual embedding similarity
          similarity: userInterests.includes(activityData.category) ? 0.8 : 0.4,
        };
        activityList.push(activity);
      });
      
      // Sort by similarity (highest first)
      activityList.sort((a, b) => b.similarity - a.similarity);
      
      setRecommendedActivities(activityList);
      setLoading(false);
      return activityList;
    } catch (err) {
      console.error('Error fetching recommended activities:', err);
      setError('Failed to load recommendations');
      setLoading(false);
      return [];
    }
  };

  /**
   * Search for activities based on a natural language query (placeholder)
   * Will be enhanced with Claude API integration
   */
  const searchActivitiesByText = async (text) => {
    if (!text.trim()) return [];
    
    try {
      setLoading(true);
      setError(null);
      
      // This is a simplified version - will be replaced with embedding-based search
      // For now, just do a basic text search
      const words = text.toLowerCase().split(/\s+/);
      
      const activitiesQuery = query(
        collection(db, 'activities'),
        limit(20)
      );
      
      const activitiesSnapshot = await getDocs(activitiesQuery);
      const activityList = [];
      
      activitiesSnapshot.forEach((doc) => {
        const activityData = doc.data();
        const title = activityData.title?.toLowerCase() || '';
        const description = activityData.description?.toLowerCase() || '';
        const category = activityData.category?.toLowerCase() || '';
        const location = activityData.location?.toLowerCase() || '';
        
        const combinedText = `${title} ${description} ${category} ${location}`;
        
        // Simple relevance calculation based on word matching
        // Will be replaced with embedding similarity
        const relevanceScore = words.reduce((score, word) => {
          if (combinedText.includes(word)) return score + 0.2;
          return score;
        }, 0);
        
        if (relevanceScore > 0) {
          activityList.push({
            id: doc.id,
            ...activityData,
            similarity: Math.min(relevanceScore, 1.0), // Cap at 1.0
          });
        }
      });
      
      // Sort by similarity (highest first)
      activityList.sort((a, b) => b.similarity - a.similarity);
      
      setLoading(false);
      return activityList;
    } catch (err) {
      console.error('Error searching activities by text:', err);
      setError('Search failed');
      setLoading(false);
      return [];
    }
  };

  // Value object to be provided to consumers
  const value = {
    recommendedActivities,
    loading,
    error,
    fetchRecommendedActivities,
    searchActivitiesByText,
  };

  return (
    <RecommendationContext.Provider value={value}>
      {children}
    </RecommendationContext.Provider>
  );
};

// Custom hook to use the recommendation context
export const useRecommendations = () => {
  return useContext(RecommendationContext);
};

export default RecommendationContext;
