// src/services/activityService.js
import { 
    collection, 
    doc, 
    addDoc, 
    getDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    limit,
    serverTimestamp, 
    arrayUnion, 
    arrayRemove 
  } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { db, storage } from '../config/firebase';
  
  /**
   * Create a new activity in Firestore
   * @param {Object} activityData - The activity data to save
   * @returns {Promise<Object>} - The created activity with ID
   */
  export const createActivity = async (activityData) => {
    try {
      const activityWithTimestamps = {
        ...activityData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'activities'), activityWithTimestamps);
      return { id: docRef.id, ...activityWithTimestamps };
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  };
  
  /**
   * Get a specific activity by ID
   * @param {string} activityId - The activity ID to retrieve
   * @returns {Promise<Object|null>} - The activity data or null if not found
   */
  export const getActivity = async (activityId) => {
    try {
      const docRef = doc(db, 'activities', activityId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting activity:', error);
      throw error;
    }
  };
  
  /**
   * Get activities with optional filtering
   * @param {Object} options - Query options
   * @param {string} [options.category] - Filter by category
   * @param {number} [options.limit] - Maximum number of results
   * @param {boolean} [options.futureDateOnly] - Only return future activities
   * @returns {Promise<Array>} - Array of activity objects
   */
  export const getActivities = async (options = {}) => {
    try {
      const { 
        category, 
        limit: resultLimit = 20, 
        futureDateOnly = true 
      } = options;
      
      let activitiesQuery;
      
      // Build the query based on options
      if (category && futureDateOnly) {
        activitiesQuery = query(
          collection(db, 'activities'), 
          where('category', '==', category),
          where('date', '>=', new Date().toISOString()),
          orderBy('date', 'asc'),
          limit(resultLimit)
        );
      } else if (category) {
        activitiesQuery = query(
          collection(db, 'activities'), 
          where('category', '==', category),
          orderBy('date', 'asc'),
          limit(resultLimit)
        );
      } else if (futureDateOnly) {
        activitiesQuery = query(
          collection(db, 'activities'),
          where('date', '>=', new Date().toISOString()),
          orderBy('date', 'asc'),
          limit(resultLimit)
        );
      } else {
        activitiesQuery = query(
          collection(db, 'activities'),
          orderBy('date', 'asc'),
          limit(resultLimit)
        );
      }
      
      const querySnapshot = await getDocs(activitiesQuery);
      const activities = [];
      
      querySnapshot.forEach((doc) => {
        activities.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return activities;
    } catch (error) {
      console.error('Error getting activities:', error);
      throw error;
    }
  };
  
  /**
   * Get activities created by a specific user
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} - Array of activity objects
   */
  export const getUserHostedActivities = async (userId) => {
    try {
      const activitiesQuery = query(
        collection(db, 'activities'),
        where('hostId', '==', userId),
        orderBy('date', 'asc')
      );
      
      const querySnapshot = await getDocs(activitiesQuery);
      const activities = [];
      
      querySnapshot.forEach((doc) => {
        activities.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return activities;
    } catch (error) {
      console.error('Error getting user hosted activities:', error);
      throw error;
    }
  };
  
  /**
   * Get activities that a user has joined
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} - Array of activity objects
   */
  export const getUserJoinedActivities = async (userId) => {
    try {
      // This query looks for activities where the participants array contains an object with the user's ID
      const activitiesQuery = query(
        collection(db, 'activities'),
        where('participants', 'array-contains', { id: userId }),
        orderBy('date', 'asc')
      );
      
      const querySnapshot = await getDocs(activitiesQuery);
      const activities = [];
      
      querySnapshot.forEach((doc) => {
        activities.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return activities;
    } catch (error) {
      console.error('Error getting user joined activities:', error);
      throw error;
    }
  };
  
  /**
   * Update an existing activity
   * @param {string} activityId - The activity ID to update
   * @param {Object} updateData - The data to update
   * @returns {Promise<boolean>} - Success indicator
   */
  export const updateActivity = async (activityId, updateData) => {
    try {
      const docRef = doc(db, 'activities', activityId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  };
  
  /**
   * Delete an activity
   * @param {string} activityId - The activity ID to delete
   * @returns {Promise<boolean>} - Success indicator
   */
  export const deleteActivity = async (activityId) => {
    try {
      const docRef = doc(db, 'activities', activityId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  };
  
  /**
   * Add a participant to an activity
   * @param {string} activityId - The activity ID
   * @param {Object} participant - The participant to add
   * @returns {Promise<boolean>} - Success indicator
   */
  export const addParticipant = async (activityId, participant) => {
    try {
      const activityRef = doc(db, 'activities', activityId);
      
      // Add participant with timestamp
      const participantWithTimestamp = {
        ...participant,
        joinedAt: new Date().toISOString()
      };
      
      await updateDoc(activityRef, {
        participants: arrayUnion(participantWithTimestamp),
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error adding participant:', error);
      throw error;
    }
  };
  
  /**
   * Remove a participant from an activity
   * @param {string} activityId - The activity ID
   * @param {Object} participant - The participant object to remove
   * @returns {Promise<boolean>} - Success indicator
   */
  export const removeParticipant = async (activityId, participant) => {
    try {
      const activityRef = doc(db, 'activities', activityId);
      
      await updateDoc(activityRef, {
        participants: arrayRemove(participant),
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error removing participant:', error);
      throw error;
    }
  };
  
  /**
   * Upload an activity image to Firebase Storage
   * @param {string} uri - Local image URI
   * @returns {Promise<string>} - Download URL of uploaded image
   */
  export const uploadActivityImage = async (uri) => {
    try {
      // Create a unique filename
      const filename = `activity_${Date.now()}.jpg`;
      const storageRef = ref(storage, `activities/${filename}`);
      
      // Fetch the image data
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Upload the file
      await uploadBytes(storageRef, blob);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading activity image:', error);
      throw error;
    }
  };