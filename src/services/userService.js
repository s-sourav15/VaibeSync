// // src/services/userService.js
// import { 
//     doc, 
//     getDoc, 
//     setDoc, 
//     updateDoc,
//     serverTimestamp 
//   } from 'firebase/firestore';
//   import { db, auth } from '../config/firebase';
  
//   // db is now imported from config/firebase.js
  
//   /**
//    * Creates a new user profile in Firestore
//    * @param {string} userId - The Firebase Auth user ID
//    * @param {object} userData - Initial user data (name, bio, etc.)
//    */
//   export const createUserProfile = async (userId, userData = {}) => {
//     try {
//       const userRef = doc(db, 'users', userId);
      
//       // Create default user data structure
//       const userDataWithDefaults = {
//         displayName: userData.displayName || '',
//         email: userData.email || '',
//         photoURL: userData.photoURL || '',
//         bio: userData.bio || '',
//         interests: userData.interests || [],
//         location: userData.location || '',
//         createdAt: serverTimestamp(),
//         updatedAt: serverTimestamp(),
//         ...userData, // Include any additional data passed
//       };
      
//       await setDoc(userRef, userDataWithDefaults);
//       return userDataWithDefaults;
//     } catch (error) {
//       console.error('Error creating user profile:', error);
//       throw error;
//     }
//   };
  
//   /**
//    * Gets the current user's profile from Firestore
//    * @returns {Promise<object|null>} User profile data
//    */
//   export const getCurrentUserProfile = async () => {
//     try {
//       const user = auth.currentUser;
      
//       if (!user) return null;
      
//       try {
//         const userRef = doc(db, 'users', user.uid);
//         const userSnap = await getDoc(userRef);
        
//         if (userSnap.exists()) {
//           return { id: userSnap.id, ...userSnap.data() };
//         } else {
//           // If profile doesn't exist, create a default one
//           const defaultProfile = {
//             displayName: user.displayName || '',
//             email: user.email || '',
//             photoURL: user.photoURL || '',
//           };
          
//           await createUserProfile(user.uid, defaultProfile);
//           return defaultProfile;
//         }
//       } catch (firestoreError) {
//         console.error('Error accessing Firestore:', firestoreError);
        
//         // If we're offline, return basic profile from auth
//         if (firestoreError.code === 'failed-precondition' || 
//             firestoreError.message.includes('offline')) {
//           return {
//             id: user.uid,
//             displayName: user.displayName || '',
//             email: user.email || '',
//             photoURL: user.photoURL || '',
//             // Add fallback data
//             bio: 'Profile data unavailable while offline',
//             interests: [],
//             isOfflineData: true
//           };
//         }
//         throw firestoreError;
//       }
//     } catch (error) {
//       console.error('Error getting user profile:', error);
//       throw error;
//     }
//   };
  
//   /**
//    * Updates the current user's profile data
//    * @param {object} profileData - New profile data to update
//    */
//   export const updateUserProfile = async (profileData) => {
//     try {
//       const user = auth.currentUser;
      
//       if (!user) throw new Error('No authenticated user');
      
//       const userRef = doc(db, 'users', user.uid);
      
//       // Add updatedAt timestamp
//       const dataToUpdate = {
//         ...profileData,
//         updatedAt: serverTimestamp(),
//       };
      
//       try {
//         await updateDoc(userRef, dataToUpdate);
//         return dataToUpdate;
//       } catch (firestoreError) {
//         console.error('Error updating Firestore:', firestoreError);
        
//         // If we're offline, return error with clear message
//         if (firestoreError.code === 'failed-precondition' || 
//             firestoreError.message.includes('offline')) {
//           throw new Error('Cannot update profile while offline. Please check your internet connection and try again.');
//         }
//         throw firestoreError;
//       }
//     } catch (error) {
//       console.error('Error updating user profile:', error);
//       throw error;
//     }
//   };
  
//   /**
//    * Gets a user profile by ID
//    * @param {string} userId - User ID to fetch
//    * @returns {Promise<object|null>} User profile data
//    */
//   export const getUserProfileById = async (userId) => {
//     try {
//       const userRef = doc(db, 'users', userId);
//       const userSnap = await getDoc(userRef);
      
//       if (userSnap.exists()) {
//         return { id: userSnap.id, ...userSnap.data() };
//       }
      
//       return null;
//     } catch (error) {
//       console.error('Error getting user by ID:', error);
//       throw error;
//     }
//   };
// src/services/userService.js
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc,
    serverTimestamp 
  } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { db, storage, auth } from '../config/firebase';
  
  /**
   * Creates a new user profile in Firestore
   * @param {string} userId - The Firebase Auth user ID
   * @param {object} userData - Initial user data (name, bio, etc.)
   */
  export const createUserProfile = async (userId, userData = {}) => {
    try {
      const userRef = doc(db, 'users', userId);
      
      // Create default user data structure
      const userDataWithDefaults = {
        displayName: userData.displayName || '',
        email: userData.email || '',
        photoURL: userData.photoURL || '',
        bio: userData.bio || '',
        interests: userData.interests || [],
        location: userData.location || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...userData, // Include any additional data passed
      };
      
      await setDoc(userRef, userDataWithDefaults);
      return userDataWithDefaults;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  };
  
  /**
   * Gets the current user's profile from Firestore
   * @returns {Promise<object|null>} User profile data
   */
  export const getCurrentUserProfile = async () => {
    try {
      const user = auth.currentUser;
      
      if (!user) return null;
      
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          return { id: userSnap.id, ...userSnap.data() };
        } else {
          // If profile doesn't exist, create a default one
          const defaultProfile = {
            displayName: user.displayName || '',
            email: user.email || '',
            photoURL: user.photoURL || '',
          };
          
          await createUserProfile(user.uid, defaultProfile);
          return defaultProfile;
        }
      } catch (firestoreError) {
        console.error('Error accessing Firestore:', firestoreError);
        
        // If we're offline, return basic profile from auth
        if (firestoreError.code === 'failed-precondition' || 
            firestoreError.message.includes('offline')) {
          return {
            id: user.uid,
            displayName: user.displayName || '',
            email: user.email || '',
            photoURL: user.photoURL || '',
            // Add fallback data
            bio: 'Profile data unavailable while offline',
            interests: [],
            isOfflineData: true
          };
        }
        throw firestoreError;
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  };
  
  /**
   * Updates the current user's profile data
   * @param {object} profileData - New profile data to update
   */
  export const updateUserProfile = async (profileData) => {
    try {
      const user = auth.currentUser;
      
      if (!user) throw new Error('No authenticated user');
      
      const userRef = doc(db, 'users', user.uid);
      
      // Add updatedAt timestamp
      const dataToUpdate = {
        ...profileData,
        updatedAt: serverTimestamp(),
      };
      
      try {
        await updateDoc(userRef, dataToUpdate);
        return dataToUpdate;
      } catch (firestoreError) {
        console.error('Error updating Firestore:', firestoreError);
        
        // If we're offline, return error with clear message
        if (firestoreError.code === 'failed-precondition' || 
            firestoreError.message.includes('offline')) {
          throw new Error('Cannot update profile while offline. Please check your internet connection and try again.');
        }
        throw firestoreError;
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };
  
  /**
   * Gets a user profile by ID
   * @param {string} userId - User ID to fetch
   * @returns {Promise<object|null>} User profile data
   */
  export const getUserProfileById = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  };
  
  /**
   * Uploads a profile image to Firebase Storage and returns the URL
   * @param {string} uri - The local URI of the image file
   * @returns {Promise<string>} The download URL of the uploaded image
   */
  export const uploadProfileImage = async (uri) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');
      
      // Create a reference to the file location in Firebase Storage
      const storageRef = ref(storage, `profiles/${user.uid}/${Date.now()}.jpg`);
      
      // Fetch the image data
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Upload the file
      await uploadBytes(storageRef, blob);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update user profile with new photo URL
      await updateUserProfile({ photoURL: downloadURL });
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
  };