// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// This configuration works - do not change it
const firebaseConfig = {
  apiKey: "AIzaSyAU3-0hTJnbai5gimzqaKDIYa0DWCY0jgM",
  authDomain: "vaibesync.firebaseapp.com",
  projectId: "vaibesync",
  storageBucket: "vaibesync.appspot.com", // Make sure this is correct!
  messagingSenderId: "815049374301",
  appId: "1:815049374301:web:06257de8ebcd01a70cebb4",
  measurementId: "G-9V6YW106LE"
};

// Initialize Firebase
let app;
let db;
let auth;
let storage;

try {
  // Initialize Firebase app
  app = initializeApp(firebaseConfig);
  console.log("Firebase app initialized successfully");
  
  // Initialize Firebase services
  auth = getAuth(app);
  console.log("Firebase Auth initialized successfully");
  
  db = getFirestore(app);
  console.log("Firestore initialized successfully");
  
  // Initialize Storage
  storage = getStorage(app);
  console.log("Firebase Storage initialized successfully");
  
  // Enable offline persistence (only run once at app startup)
  enableIndexedDbPersistence(db)
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn(
          'Multiple tabs open, persistence can only be enabled in one tab at a time.'
        );
      } else if (err.code === 'unimplemented') {
        console.warn(
          'The current browser does not support all of the features required to enable persistence.'
        );
      } else {
        console.error('Error enabling persistence:', err);
      }
    });
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

export { app, auth, db, storage };