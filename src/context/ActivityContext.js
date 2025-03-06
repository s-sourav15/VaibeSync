// src/context/ActivityContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { MOCK_ACTIVITIES } from '../screens/main/HomeScreen';
import { Alert } from 'react-native';

// Create context
const ActivityContext = createContext();

// Provider component
export const ActivityProvider = ({ children }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load initial activities
  useEffect(() => {
    // Simulate fetching from a database
    const fetchActivities = async () => {
      try {
        // In a real app, this would be a Firebase call
        // For now, we'll use our mock data
        setTimeout(() => {
          setActivities(MOCK_ACTIVITIES);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching activities:', error);
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Create a new activity
  const createActivity = async (activityData) => {
    try {
      // Generate a new ID
      const newId = `${Date.now()}`;
      
      // Create the new activity object with default values
      const newActivity = {
        id: newId,
        ...activityData,
        currentParticipants: 0,
        participants: [],
        host: {
          id: activityData.hostId || 'current-user',
          name: activityData.hostName || 'Current User',
          photoURL: activityData.hostPhotoURL || 'https://source.unsplash.com/random/100x100/?portrait',
        }
      };
      
      // Add to state (in a real app, this would also save to Firebase)
      setActivities(prevActivities => [newActivity, ...prevActivities]);
      
      return newActivity;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  };

  // Join an activity
  const joinActivity = async (activityId, user) => {
    try {
      setActivities(prevActivities => 
        prevActivities.map(activity => {
          if (activity.id === activityId) {
            // Check if already at max capacity
            if (activity.currentParticipants >= activity.maxParticipants) {
              throw new Error('This activity is already full');
            }
            
            // Check if user is already a participant
            const isParticipant = activity.participants.some(p => p.id === user.id);
            if (isParticipant) {
              throw new Error('You are already a participant in this activity');
            }
            
            // Add user to participants and increment count
            return {
              ...activity,
              currentParticipants: activity.currentParticipants + 1,
              participants: [...activity.participants, user]
            };
          }
          return activity;
        })
      );
      
      return true;
    } catch (error) {
      console.error('Error joining activity:', error);
      throw error;
    }
  };

  // Leave an activity
  const leaveActivity = async (activityId, userId) => {
    try {
      setActivities(prevActivities => 
        prevActivities.map(activity => {
          if (activity.id === activityId) {
            // Check if user is a participant
            const isParticipant = activity.participants.some(p => p.id === userId);
            if (!isParticipant) {
              throw new Error('You are not a participant in this activity');
            }
            
            // Remove user from participants and decrement count
            return {
              ...activity,
              currentParticipants: activity.currentParticipants - 1,
              participants: activity.participants.filter(p => p.id !== userId)
            };
          }
          return activity;
        })
      );
      
      return true;
    } catch (error) {
      console.error('Error leaving activity:', error);
      throw error;
    }
  };

  // Get activity by ID
  const getActivityById = (activityId) => {
    return activities.find(activity => activity.id === activityId);
  };

  const value = {
    activities,
    loading,
    createActivity,
    joinActivity,
    leaveActivity,
    getActivityById
  };

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
};

// Custom hook to use the activity context
export const useActivities = () => {
  return useContext(ActivityContext);
};