// // src/context/ActivityContext.js
// import React, { createContext, useState, useContext, useEffect } from 'react';
// import { MOCK_ACTIVITIES } from '../screens/main/HomeScreen';
// import { Alert } from 'react-native';

// // Create context
// const ActivityContext = createContext();

// // Provider component
// export const ActivityProvider = ({ children }) => {
//   const [activities, setActivities] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // Load initial activities
//   useEffect(() => {
//     // Simulate fetching from a database
//     const fetchActivities = async () => {
//       try {
//         // In a real app, this would be a Firebase call
//         // For now, we'll use our mock data
//         setTimeout(() => {
//           setActivities(MOCK_ACTIVITIES);
//           setLoading(false);
//         }, 1000);
//       } catch (error) {
//         console.error('Error fetching activities:', error);
//         setLoading(false);
//       }
//     };

//     fetchActivities();
//   }, []);

//   // Create a new activity
//   const createActivity = async (activityData) => {
//     try {
//       // Generate a new ID
//       const newId = `${Date.now()}`;
      
//       // Create the new activity object with default values
//       const newActivity = {
//         id: newId,
//         ...activityData,
//         currentParticipants: 0,
//         participants: [],
//         host: {
//           id: activityData.hostId || 'current-user',
//           name: activityData.hostName || 'Current User',
//           photoURL: activityData.hostPhotoURL || 'https://source.unsplash.com/random/100x100/?portrait',
//         }
//       };
      
//       // Add to state (in a real app, this would also save to Firebase)
//       setActivities(prevActivities => [newActivity, ...prevActivities]);
      
//       return newActivity;
//     } catch (error) {
//       console.error('Error creating activity:', error);
//       throw error;
//     }
//   };

//   // Join an activity
//   const joinActivity = async (activityId, user) => {
//     try {
//       setActivities(prevActivities => 
//         prevActivities.map(activity => {
//           if (activity.id === activityId) {
//             // Check if already at max capacity
//             if (activity.currentParticipants >= activity.maxParticipants) {
//               throw new Error('This activity is already full');
//             }
            
//             // Check if user is already a participant
//             const isParticipant = activity.participants.some(p => p.id === user.id);
//             if (isParticipant) {
//               throw new Error('You are already a participant in this activity');
//             }
            
//             // Add user to participants and increment count
//             return {
//               ...activity,
//               currentParticipants: activity.currentParticipants + 1,
//               participants: [...activity.participants, user]
//             };
//           }
//           return activity;
//         })
//       );
      
//       return true;
//     } catch (error) {
//       console.error('Error joining activity:', error);
//       throw error;
//     }
//   };

//   // Leave an activity
//   const leaveActivity = async (activityId, userId) => {
//     try {
//       setActivities(prevActivities => 
//         prevActivities.map(activity => {
//           if (activity.id === activityId) {
//             // Check if user is a participant
//             const isParticipant = activity.participants.some(p => p.id === userId);
//             if (!isParticipant) {
//               throw new Error('You are not a participant in this activity');
//             }
            
//             // Remove user from participants and decrement count
//             return {
//               ...activity,
//               currentParticipants: activity.currentParticipants - 1,
//               participants: activity.participants.filter(p => p.id !== userId)
//             };
//           }
//           return activity;
//         })
//       );
      
//       return true;
//     } catch (error) {
//       console.error('Error leaving activity:', error);
//       throw error;
//     }
//   };

//   // Get activity by ID
//   const getActivityById = (activityId) => {
//     return activities.find(activity => activity.id === activityId);
//   };

//   const value = {
//     activities,
//     loading,
//     createActivity,
//     joinActivity,
//     leaveActivity,
//     getActivityById
//   };

//   return (
//     <ActivityContext.Provider value={value}>
//       {children}
//     </ActivityContext.Provider>
//   );
// };

// // Custom hook to use the activity context
// export const useActivities = () => {
//   return useContext(ActivityContext);
// };
// src/context/ActivityContext.js
// src/context/ActivityContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
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
  serverTimestamp, 
  arrayUnion, 
  arrayRemove,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { showNetworkErrorIfOffline } from '../utils/network';

// Sample categories for activities
export const ACTIVITY_CATEGORIES = [
  'Fitness',
  'Outdoors',
  'Sports',
  'Education',
  'Arts & Crafts',
  'Social',
  'Technology',
  'Food & Drink',
  'Music',
  'Other'
];

// Default fallback image for users/hosts
const DEFAULT_PHOTO_URL = 'https://source.unsplash.com/random/100x100/?portrait';

// Create context
const ActivityContext = createContext();

export const ActivityProvider = ({ children }) => {
  const [activities, setActivities] = useState([]);
  const [userActivities, setUserActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // Real-time subscription to activities
  const subscribeToActivities = (category = null, maxResults = 20) => {
    setLoading(true);
    setError(null);
    
    try {
      let activitiesQuery;
      
      if (category) {
        activitiesQuery = query(
          collection(db, 'activities'), 
          where('category', '==', category),
          where('date', '>=', new Date().toISOString()),
          orderBy('date', 'asc'),
          limit(maxResults)
        );
      } else {
        activitiesQuery = query(
          collection(db, 'activities'),
          where('date', '>=', new Date().toISOString()),
          orderBy('date', 'asc'),
          limit(maxResults)
        );
      }
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
        const activitiesList = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Ensure host object is properly structured with fallbacks
          const host = {
            id: data.hostId || 'unknown',
            name: data.hostName || 'Unknown Host',
            photoURL: data.hostPhotoURL || DEFAULT_PHOTO_URL
          };
          
          activitiesList.push({
            id: doc.id,
            ...data,
            participants: data.participants || [],
            currentParticipants: data.participants?.length || 0,
            host // Add the properly structured host object
          });
        });
        
        setActivities(activitiesList);
        setLoading(false);
      }, (err) => {
        console.error('Real-time activities error:', err);
        setError('Failed to load activities. Please try again.');
        setLoading(false);
      });
      
      // Return unsubscribe function to clean up listener
      return unsubscribe;
    } catch (err) {
      console.error('Error setting up activities listener:', err);
      setError('Failed to load activities. Please try again.');
      setLoading(false);
      return () => {}; // Return empty function in case of error
    }
  };

  // Fetch activities for a specific category (without real-time updates)
  const fetchActivities = async (category = null, maxResults = 20) => {
    try {
      setLoading(true);
      setError(null);
      
      let activitiesQuery;
      
      if (category) {
        activitiesQuery = query(
          collection(db, 'activities'), 
          where('category', '==', category),
          where('date', '>=', new Date().toISOString()),
          orderBy('date', 'asc'),
          limit(maxResults)
        );
      } else {
        activitiesQuery = query(
          collection(db, 'activities'),
          where('date', '>=', new Date().toISOString()),
          orderBy('date', 'asc'),
          limit(maxResults)
        );
      }
      
      const querySnapshot = await getDocs(activitiesQuery);
      const activitiesList = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Ensure host object is properly structured with fallbacks
        const host = {
          id: data.hostId || 'unknown',
          name: data.hostName || 'Unknown Host',
          photoURL: data.hostPhotoURL || DEFAULT_PHOTO_URL
        };
        
        activitiesList.push({
          id: doc.id,
          ...data,
          participants: data.participants || [],
          currentParticipants: data.participants?.length || 0,
          host // Add the properly structured host object
        });
      });
      
      setActivities(activitiesList);
      return activitiesList;
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activities. Please try again.');
      
      // If offline, try to load from local state if available
      if (err.code === 'failed-precondition' || err.message?.includes('offline')) {
        return activities; // Return cached activities
      }
      
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch activities the current user has joined
  const fetchUserActivities = async () => {
    if (!currentUser) {
      setUserActivities([]);
      return [];
    }
    
    try {
      setLoading(true);
      
      // This query requires a composite index in Firestore
      // If the index doesn't exist, follow the link in the error message to create it
      const activitiesQuery = query(
        collection(db, 'activities'),
        where('participants', 'array-contains', { 
          id: currentUser.uid 
        }),
        orderBy('date', 'asc')
      );
      
      try {
        const querySnapshot = await getDocs(activitiesQuery);
        const userActivitiesList = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Ensure host object is properly structured with fallbacks
          const host = {
            id: data.hostId || 'unknown',
            name: data.hostName || 'Unknown Host',
            photoURL: data.hostPhotoURL || DEFAULT_PHOTO_URL
          };
          
          userActivitiesList.push({
            id: doc.id,
            ...data,
            participants: data.participants || [],
            currentParticipants: data.participants?.length || 0,
            host
          });
        });
        
        setUserActivities(userActivitiesList);
        return userActivitiesList;
      } catch (indexError) {
        console.error('Error fetching user activities:', indexError);
        // If this is an index error, provide a helpful message
        if (indexError.message?.includes('index')) {
          Alert.alert(
            'Database Setup Required',
            'Please click the link in the console to create required database indexes.',
            [{ text: 'OK' }]
          );
        }
        return [];
      }
    } catch (err) {
      console.error('Error fetching user activities:', err);
      // If offline, use local state
      if (err.code === 'failed-precondition' || err.message?.includes('offline')) {
        return userActivities; // Return cached activities
      }
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get an activity by ID
  const getActivityById = async (activityId) => {
    try {
      // First check local state for the activity
      const localActivity = activities.find(activity => activity.id === activityId);
      if (localActivity) {
        return localActivity;
      }
      
      // If not found locally, fetch from Firestore
      const activityRef = doc(db, 'activities', activityId);
      const activitySnap = await getDoc(activityRef);
      
      if (activitySnap.exists()) {
        const data = activitySnap.data();
        // Ensure host object is properly structured with fallbacks
        const host = {
          id: data.hostId || 'unknown',
          name: data.hostName || 'Unknown Host',
          photoURL: data.hostPhotoURL || DEFAULT_PHOTO_URL
        };
        
        return {
          id: activitySnap.id,
          ...data,
          participants: data.participants || [],
          currentParticipants: data.participants?.length || 0,
          host
        };
      }
      
      throw new Error('Activity not found');
    } catch (err) {
      console.error('Error getting activity:', err);
      
      // If offline, try to find in local state again
      const localActivity = activities.find(activity => activity.id === activityId);
      return localActivity || null;
    }
  };

  // Create a new activity
  const createActivity = async (activityData) => {
    const isOnline = await showNetworkErrorIfOffline();
    if (!isOnline) {
      throw new Error('Cannot create activities while offline');
    }
    
    if (!currentUser) {
      throw new Error('You must be logged in to create an activity');
    }
    
    try {
      // Create host object with defaults
      const host = {
        id: currentUser.uid,
        name: currentUser.displayName || 'Anonymous Host',
        photoURL: currentUser.photoURL || DEFAULT_PHOTO_URL
      };
      
      // Create initial participant with host
      const initialParticipant = {
        id: currentUser.uid,
        name: currentUser.displayName || 'Anonymous Host',
        photoURL: currentUser.photoURL || DEFAULT_PHOTO_URL,
        joinedAt: new Date().toISOString(),
        isHost: true
      };
      
      // Create activity with default values
      const newActivity = {
        ...activityData,
        hostId: host.id,
        hostName: host.name,
        hostPhotoURL: host.photoURL || DEFAULT_PHOTO_URL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        participants: [initialParticipant], // Host is automatically a participant
        currentParticipants: 1,
        isActive: true
      };
      
      // Add activity to Firestore
      const docRef = await addDoc(collection(db, 'activities'), newActivity);
      
      // Get the newly created activity with ID
      const createdActivity = {
        id: docRef.id,
        ...newActivity,
        host
      };
      
      // Update local state
      setActivities(prev => [createdActivity, ...prev]);
      setUserActivities(prev => [createdActivity, ...prev]);
      
      return createdActivity;
    } catch (err) {
      console.error('Error creating activity:', err);
      throw new Error('Failed to create activity: ' + (err.message || 'Unknown error'));
    }
  };

  // Update an activity
  const updateActivity = async (activityId, updateData) => {
    const isOnline = await showNetworkErrorIfOffline();
    if (!isOnline) {
      throw new Error('Cannot update activities while offline');
    }
    
    if (!currentUser) {
      throw new Error('You must be logged in to update an activity');
    }
    
    try {
      const activityRef = doc(db, 'activities', activityId);
      const activitySnap = await getDoc(activityRef);
      
      if (!activitySnap.exists()) {
        throw new Error('Activity not found');
      }
      
      const activityData = activitySnap.data();
      
      // Verify user is the host
      if (activityData.hostId !== currentUser.uid) {
        throw new Error('Only the host can update this activity');
      }
      
      // Ensure host data remains consistent if it was part of the update
      const updatedData = {
        ...updateData,
        updatedAt: serverTimestamp()
      };
      
      if (updateData.hostPhotoURL) {
        updatedData.hostPhotoURL = updateData.hostPhotoURL || DEFAULT_PHOTO_URL;
      }
      
      // Update activity
      await updateDoc(activityRef, updatedData);
      
      // Update local state
      const updatedActivities = activities.map(activity => 
        activity.id === activityId 
        ? { 
            ...activity, 
            ...updateData, 
            host: { 
              ...activity.host, 
              photoURL: updateData.hostPhotoURL || activity.host.photoURL || DEFAULT_PHOTO_URL 
            },
            updatedAt: new Date() 
          } 
        : activity
      );
      setActivities(updatedActivities);
      
      const updatedUserActivities = userActivities.map(activity => 
        activity.id === activityId 
        ? { 
            ...activity, 
            ...updateData, 
            host: { 
              ...activity.host, 
              photoURL: updateData.hostPhotoURL || activity.host.photoURL || DEFAULT_PHOTO_URL 
            },
            updatedAt: new Date() 
          } 
        : activity
      );
      setUserActivities(updatedUserActivities);
      
      return { id: activityId, ...activityData, ...updateData };
    } catch (err) {
      console.error('Error updating activity:', err);
      throw new Error('Failed to update activity: ' + (err.message || 'Unknown error'));
    }
  };

  // Delete an activity
  const deleteActivity = async (activityId) => {
    const isOnline = await showNetworkErrorIfOffline();
    if (!isOnline) {
      throw new Error('Cannot delete activities while offline');
    }
    
    if (!currentUser) {
      throw new Error('You must be logged in to delete an activity');
    }
    
    try {
      const activityRef = doc(db, 'activities', activityId);
      const activitySnap = await getDoc(activityRef);
      
      if (!activitySnap.exists()) {
        throw new Error('Activity not found');
      }
      
      const activityData = activitySnap.data();
      
      // Verify user is the host
      if (activityData.hostId !== currentUser.uid) {
        throw new Error('Only the host can delete this activity');
      }
      
      // Delete activity
      await deleteDoc(activityRef);
      
      // Update local state
      setActivities(prev => prev.filter(activity => activity.id !== activityId));
      setUserActivities(prev => prev.filter(activity => activity.id !== activityId));
      
      return true;
    } catch (err) {
      console.error('Error deleting activity:', err);
      throw new Error('Failed to delete activity: ' + (err.message || 'Unknown error'));
    }
  };

  // Join an activity
  const joinActivity = async (activityId, user) => {
    const isOnline = await showNetworkErrorIfOffline();
    if (!isOnline) {
      throw new Error('Cannot join activities while offline');
    }
    
    if (!currentUser) {
      throw new Error('You must be logged in to join an activity');
    }
    
    try {
      const activityRef = doc(db, 'activities', activityId);
      const activitySnap = await getDoc(activityRef);
      
      if (!activitySnap.exists()) {
        throw new Error('Activity not found');
      }
      
      const activityData = activitySnap.data();
      
      // Check if already at maximum participants
      if (activityData.participants && activityData.participants.length >= activityData.maxParticipants) {
        throw new Error('This activity is already full');
      }
      
      // Check if user is already a participant
      const existingParticipant = activityData.participants?.find(p => p.id === user.id);
      if (existingParticipant) {
        throw new Error('You have already joined this activity');
      }
      
      // Create participant object with defaults
      const participant = {
        id: user.id,
        name: user.name || 'Anonymous',
        photoURL: user.photoURL || DEFAULT_PHOTO_URL,
        joinedAt: new Date().toISOString()
      };
      
      // Update activity with new participant
      await updateDoc(activityRef, {
        participants: arrayUnion(participant),
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      const updatedActivities = activities.map(activity => {
        if (activity.id === activityId) {
          const updatedParticipants = [...(activity.participants || []), participant];
          return {
            ...activity,
            participants: updatedParticipants,
            currentParticipants: updatedParticipants.length
          };
        }
        return activity;
      });
      setActivities(updatedActivities);
      
      // Add to user activities
      const activity = updatedActivities.find(a => a.id === activityId);
      if (activity) {
        setUserActivities(prev => [...prev, activity]);
      }
      
      return true;
    } catch (err) {
      console.error('Error joining activity:', err);
      throw new Error('Failed to join activity: ' + (err.message || 'Unknown error'));
    }
  };

  // Leave an activity
  const leaveActivity = async (activityId, userId) => {
    const isOnline = await showNetworkErrorIfOffline();
    if (!isOnline) {
      throw new Error('Cannot leave activities while offline');
    }
    
    if (!currentUser) {
      throw new Error('You must be logged in to leave an activity');
    }
    
    try {
      const activityRef = doc(db, 'activities', activityId);
      const activitySnap = await getDoc(activityRef);
      
      if (!activitySnap.exists()) {
        throw new Error('Activity not found');
      }
      
      const activityData = activitySnap.data();
      
      // Find the participant to remove
      const participant = activityData.participants && 
        activityData.participants.find(p => p.id === userId);
      
      if (!participant) {
        throw new Error('You are not a participant in this activity');
      }
      
      // Check if user is the host
      if (activityData.hostId === userId) {
        throw new Error('As the host, you cannot leave your own activity. You may delete it instead.');
      }
      
      // Update activity to remove participant
      await updateDoc(activityRef, {
        participants: arrayRemove(participant),
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      const updatedActivities = activities.map(activity => {
        if (activity.id === activityId) {
          const updatedParticipants = (activity.participants || []).filter(p => p.id !== userId);
          return {
            ...activity,
            participants: updatedParticipants,
            currentParticipants: updatedParticipants.length
          };
        }
        return activity;
      });
      setActivities(updatedActivities);
      
      // Remove from user activities
      setUserActivities(prev => prev.filter(activity => activity.id !== activityId));
      
      return true;
    } catch (err) {
      console.error('Error leaving activity:', err);
      throw new Error('Failed to leave activity: ' + (err.message || 'Unknown error'));
    }
  };

  // Load initial data when component mounts or when user authentication changes
  useEffect(() => {
    let unsubscribeActivities = null;
    
    if (currentUser) {
      // Set up real-time listener for activities
      unsubscribeActivities = subscribeToActivities();
      
      // Load user activities
      fetchUserActivities().catch(err => {
        console.error('Initial user activity fetch error:', err);
      });
    } else {
      // Clear user activities when signed out
      setUserActivities([]);
      
      // Load public activities for non-authenticated users
      unsubscribeActivities = subscribeToActivities();
    }
    
    // Cleanup function to unsubscribe when component unmounts
    return () => {
      if (unsubscribeActivities) {
        unsubscribeActivities();
      }
    };
  }, [currentUser]);

  // Generate dummy activities for development/demo purposes
  const generateDummyActivities = (count = 5) => {
    const categories = ACTIVITY_CATEGORIES;
    const dummyActivities = [];
    
    for (let i = 0; i < count; i++) {
      const categoryIndex = Math.floor(Math.random() * categories.length);
      const maxParticipants = 5 + Math.floor(Math.random() * 15);
      const currentParticipants = Math.floor(Math.random() * (maxParticipants - 1)) + 1;
      
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() + Math.floor(Math.random() * 30));
      
      dummyActivities.push({
        id: `dummy-${i}`,
        title: `Sample Activity ${i + 1}`,
        description: "This is a sample activity generated for development purposes. It's not stored in the database and is only visible in development builds when offline.",
        location: "Sample Location",
        category: categories[categoryIndex],
        date: randomDate.toISOString(),
        imageUrl: `https://source.unsplash.com/random/400x300/?${categories[categoryIndex].toLowerCase()}`,
        maxParticipants: maxParticipants,
        currentParticipants: currentParticipants,
        participants: [...Array(currentParticipants)].map((_, j) => ({
          id: `user-${j}`,
          name: `User ${j + 1}`,
          photoURL: DEFAULT_PHOTO_URL
        })),
        host: {
          id: 'dummy-host',
          name: 'Demo Host',
          photoURL: DEFAULT_PHOTO_URL
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      });
    }
    
    return dummyActivities;
  };

  // Value object to be provided to consumers
  const value = {
    activities,
    userActivities,
    loading,
    error,
    fetchActivities,
    fetchUserActivities,
    getActivityById,
    createActivity,
    updateActivity,
    deleteActivity,
    joinActivity,
    leaveActivity,
    generateDummyActivities,
    categories: ACTIVITY_CATEGORIES
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

export default ActivityContext;