// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { app } from '../config/firebase';
import { createUserProfile } from '../services/userService';

// Create context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(null);
  
  const auth = getAuth(app);

  // Sign up function
  const signup = async (email, password, displayName = '') => {
    try {
      // Clear any previous network errors
      setNetworkError(null);
      
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // If displayName is provided, update the profile
      if (displayName) {
        await updateProfile(user, { displayName });
      }
      
      // Create user profile in Firestore
      try {
        await createUserProfile(user.uid, {
          displayName: displayName || '',
          email: user.email,
        });
      } catch (firestoreError) {
        console.warn('Failed to create Firestore profile, but auth succeeded:', firestoreError);
        // We won't fail the signup if just the Firestore part fails
      }
      
      return user;
    } catch (error) {
      // Check if this is a network error
      if (error.code === 'auth/network-request-failed') {
        setNetworkError('Network error. Please check your internet connection.');
      }
      throw error;
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      // Clear any previous network errors
      setNetworkError(null);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      // Check if this is a network error
      if (error.code === 'auth/network-request-failed') {
        setNetworkError('Network error. Please check your internet connection.');
      }
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Set up auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, [auth]);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    loading,
    networkError,
    clearNetworkError: () => setNetworkError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
};