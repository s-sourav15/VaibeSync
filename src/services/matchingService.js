// src/services/matchingService.js
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    getDoc, 
    setDoc, 
    addDoc, 
    updateDoc, 
    serverTimestamp, 
    limit 
  } from 'firebase/firestore';
  import { db, auth } from '../config/firebase';
  import { createMatchRequestNotification } from './notificationService';
  
  /**
   * Calculate match score between two users
   * @param {Object} currentUser - Current user
   * @param {Object} otherUser - Other user
   * @returns {Object} Match score info
   */
  const calculateMatchScore = (currentUser, otherUser) => {
    let score = 0;
    const matchDetails = {
      interestsScore: 0,
      locationScore: 0,
      matchingInterests: []
    };
    
    // Match by interests
    if (currentUser.interests && otherUser.interests) {
      const currentUserInterests = currentUser.interests || [];
      const otherUserInterests = otherUser.interests || [];
      
      // Find matching interests
      const matchingInterests = currentUserInterests.filter(interest => 
        otherUserInterests.includes(interest)
      );
      
      const interestMatchPercentage = matchingInterests.length / 
        (currentUserInterests.length || 1);
      
      // Interest score (max 60 points)
      const interestsScore = Math.min(60, Math.floor(interestMatchPercentage * 60));
      
      matchDetails.interestsScore = interestsScore;
      matchDetails.matchingInterests = matchingInterests;
      
      score += interestsScore;
    }
    
    // Match by location (20 points)
    if (currentUser.location && otherUser.location && 
        currentUser.location === otherUser.location) {
      matchDetails.locationScore = 20;
      score += 20;
    }
    
    // For demo purposes, add some randomness (max 20 points)
    const randomScore = Math.floor(Math.random() * 20);
    score += randomScore;
    
    // Determine match quality based on total score
    let matchQuality = 'low';
    if (score >= 70) {
      matchQuality = 'high';
    } else if (score >= 40) {
      matchQuality = 'medium';
    }
    
    return {
      score,
      matchQuality,
      details: matchDetails
    };
  };
  
  /**
   * Get recommended matches for the current user
   * @param {number} maxResults - Maximum number of recommendations
   * @returns {Promise<Array>} Recommended matches
   */
  export const getRecommendedMatches = async (maxResults = 5) => {
    try {
      const user = auth.currentUser;
      if (!user) return [];
      
      // Get current user's profile
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) return [];
      
      const currentUserData = userSnap.data();
      
      // Get all users
      const usersRef = collection(db, 'users');
      const usersSnap = await getDocs(usersRef);
      
      // Get existing matches to exclude them
      const existingMatches = await getUserMatches('all');
      const existingMatchUserIds = existingMatches.map(match => match.otherUser.id);
      
      const recommendations = [];
      
      usersSnap.forEach(userDoc => {
        const userId = userDoc.id;
        const userData = userDoc.data();
        
        // Skip current user and existing matches
        if (userId === user.uid || existingMatchUserIds.includes(userId)) {
          return;
        }
        
        // Calculate match score
        const matchInfo = calculateMatchScore(currentUserData, userData);
        
        recommendations.push({
          user: {
            id: userId,
            ...userData
          },
          ...matchInfo
        });
      });
      
      // Sort by score (highest first) and limit results
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);
      
    } catch (error) {
      console.error('Error getting recommended matches:', error);
      return [];
    }
  };
  
  /**
   * Create a match request
   * @param {string} otherUserId - ID of user to match with
   * @param {Object} matchInfo - Match score info
   * @returns {Promise<Object>} Created match
   */
  export const createMatchRequest = async (otherUserId, matchInfo) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Check for existing match
      const existingMatch = await getMatchByUsers(user.uid, otherUserId);
      
      if (existingMatch) {
        return existingMatch;
      }
      
      // Create match document
      const matchData = {
        users: [user.uid, otherUserId].sort(), // Sort to ensure consistent ID creation
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: {
          [user.uid]: 'accepted', // Requester automatically accepts
          [otherUserId]: 'pending'
        },
        score: matchInfo.score || 0,
        matchQuality: matchInfo.matchQuality || 'low',
        details: matchInfo.details || {}
      };
      
      // Add to matches collection
      const matchesRef = collection(db, 'matches');
      const matchDoc = await addDoc(matchesRef, matchData);
      
      // Get requester's name for notification
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const userName = userSnap.exists() ? userSnap.data().displayName || 'Someone' : 'Someone';
      
      // Create notification for the other user
      await createMatchRequestNotification(otherUserId, userName, matchDoc.id);
      
      return {
        id: matchDoc.id,
        ...matchData
      };
    } catch (error) {
      console.error('Error creating match request:', error);
      throw error;
    }
  };
  
  /**
   * Respond to a match request
   * @param {string} matchId - ID of the match
   * @param {boolean} accept - Whether to accept the match
   * @returns {Promise<Object>} Updated match
   */
  export const respondToMatchRequest = async (matchId, accept) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Get match document
      const matchRef = doc(db, 'matches', matchId);
      const matchSnap = await getDoc(matchRef);
      
      if (!matchSnap.exists()) {
        throw new Error('Match not found');
      }
      
      const matchData = matchSnap.data();
      
      // Check if user is part of this match
      if (!matchData.users.includes(user.uid)) {
        throw new Error('User is not part of this match');
      }
      
      // Update match status
      await updateDoc(matchRef, {
        [`status.${user.uid}`]: accept ? 'accepted' : 'rejected',
        updatedAt: serverTimestamp()
      });
      
      // Return updated match
      return {
        id: matchId,
        ...matchData,
        status: {
          ...matchData.status,
          [user.uid]: accept ? 'accepted' : 'rejected'
        }
      };
    } catch (error) {
      console.error('Error responding to match request:', error);
      throw error;
    }
  };
  
  /**
   * Get a match by both user IDs
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Promise<Object|null>} Match object or null
   */
  export const getMatchByUsers = async (userId1, userId2) => {
    try {
      // Sort user IDs to match the stored format
      const users = [userId1, userId2].sort();
      
      // Query for match with these users
      const matchesRef = collection(db, 'matches');
      const q = query(
        matchesRef,
        where('users', '==', users)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      // Return the first match
      const match = querySnapshot.docs[0];
      return {
        id: match.id,
        ...match.data()
      };
    } catch (error) {
      console.error('Error getting match by users:', error);
      return null;
    }
  };
  
  /**
   * Get all matches for the current user
   * @param {string} status - Filter by status ('all', 'pending', 'accepted', 'rejected')
   * @returns {Promise<Array>} User's matches
   */
  export const getUserMatches = async (status = 'all') => {
    try {
      const user = auth.currentUser;
      if (!user) return [];
      
      // Query matches where user is a participant
      const matchesRef = collection(db, 'matches');
      const q = query(
        matchesRef,
        where('users', 'array-contains', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      
      const matches = [];
      
      for (const matchDoc of querySnapshot.docs) {
        const matchData = matchDoc.data();
        
        // Filter by status if needed
        if (status !== 'all' && matchData.status[user.uid] !== status) {
          continue;
        }
        
        // Get the other user's ID
        const otherUserId = matchData.users.find(id => id !== user.uid);
        
        // Get other user's data
        const otherUserRef = doc(db, 'users', otherUserId);
        const otherUserSnap = await getDoc(otherUserRef);
        
        if (otherUserSnap.exists()) {
          matches.push({
            id: matchDoc.id,
            ...matchData,
            otherUser: {
              id: otherUserId,
              ...otherUserSnap.data()
            },
            // Whether the match is mutual (both accepted)
            isMutualMatch: matchData.status[user.uid] === 'accepted' && 
                           matchData.status[otherUserId] === 'accepted'
          });
        }
      }
      
      return matches;
    } catch (error) {
      console.error('Error getting user matches:', error);
      return [];
    }
  };
  
  /**
   * Get pending match requests for the current user
   * @returns {Promise<Array>} Pending match requests
   */
  export const getPendingMatchRequests = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return [];
      
      // Query matches where user's status is pending
      const matchesRef = collection(db, 'matches');
      const q = query(
        matchesRef,
        where('users', 'array-contains', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      
      const pendingRequests = [];
      
      for (const matchDoc of querySnapshot.docs) {
        const matchData = matchDoc.data();
        
        // Only include if user's status is pending
        if (matchData.status[user.uid] !== 'pending') {
          continue;
        }
        
        // Get the requester's ID (other user)
        const otherUserId = matchData.users.find(id => id !== user.uid);
        
        // Get requester's data
        const otherUserRef = doc(db, 'users', otherUserId);
        const otherUserSnap = await getDoc(otherUserRef);
        
        if (otherUserSnap.exists()) {
          pendingRequests.push({
            id: matchDoc.id,
            ...matchData,
            otherUser: {
              id: otherUserId,
              ...otherUserSnap.data()
            },
            // Include the match creator for display purposes
            isIncoming: matchData.createdBy !== user.uid
          });
        }
      }
      
      return pendingRequests;
    } catch (error) {
      console.error('Error getting pending match requests:', error);
      return [];
    }
  };
  
  /**
   * Get mutual matches (both users accepted)
   * @returns {Promise<Array>} Mutual matches
   */
  export const getMutualMatches = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return [];
      
      // Get all user matches
      const allMatches = await getUserMatches('accepted');
      
      // Filter for mutual matches (both users accepted)
      return allMatches.filter(match => match.isMutualMatch);
    } catch (error) {
      console.error('Error getting mutual matches:', error);
      return [];
    }
  };