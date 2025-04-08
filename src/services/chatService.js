// src/services/chatService.js
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    serverTimestamp, 
    doc, 
    getDoc, 
    updateDoc 
  } from 'firebase/firestore';
  import { db, auth } from '../config/firebase';
  
  /**
   * Get all conversations for the current user
   * @returns {Promise<Array>} Conversations
   */
  export const getConversations = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return [];
      
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', user.uid),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      const conversations = [];
      for (const doc of querySnapshot.docs) {
        // Get conversation data
        const data = doc.data();
        
        // Get other participant
        const otherParticipantId = data.participants.find(id => id !== user.uid);
        
        // Get other user's profile
        const userRef = doc(db, 'users', otherParticipantId);
        const userSnap = await getDoc(userRef);
        
        conversations.push({
          id: doc.id,
          ...data,
          otherUser: userSnap.exists() ? 
            { id: userSnap.id, ...userSnap.data() } : 
            { id: otherParticipantId, displayName: 'Unknown User' }
        });
      }
      
      return conversations;
    } catch (error) {
      console.error('Error getting conversations:', error);
      return [];
    }
  };
  
  /**
   * Get messages for a specific conversation
   * @param {string} conversationId - ID of the conversation
   * @returns {Promise<Array>} Messages
   */
  export const getMessages = async (conversationId) => {
    try {
      if (!conversationId) return [];
      
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      
      const querySnapshot = await getDocs(q);
      
      const messages = [];
      querySnapshot.forEach(doc => {
        messages.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return messages;
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  };
  
  /**
   * Send a message
   * @param {string} conversationId - ID of the conversation
   * @param {string} text - Message text
   * @returns {Promise<Object>} Message object
   */
  export const sendMessage = async (conversationId, text) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      if (!text.trim()) throw new Error('Message cannot be empty');
      
      // Add message to conversation
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const messageDoc = await addDoc(messagesRef, {
        text,
        senderId: user.uid,
        timestamp: serverTimestamp(),
        read: false
      });
      
      // Update conversation's last message
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        lastMessage: {
          text,
          senderId: user.uid,
          timestamp: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });
      
      return {
        id: messageDoc.id,
        text,
        senderId: user.uid,
        timestamp: new Date(),
        read: false
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };
  
  /**
   * Create a conversation or get existing one
   * @param {string} otherUserId - ID of the other user
   * @returns {Promise<Object>} Conversation object
   */
  export const createConversation = async (otherUserId) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Check if conversation already exists
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Find conversation with this specific user
      let existingConversation = null;
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.participants.includes(otherUserId)) {
          existingConversation = {
            id: doc.id,
            ...data
          };
        }
      });
      
      if (existingConversation) {
        return existingConversation;
      }
      
      // Create new conversation
      const newConversation = {
        participants: [user.uid, otherUserId],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: {
          text: 'Start the conversation!',
          senderId: user.uid,
          timestamp: serverTimestamp()
        }
      };
      
      const docRef = await addDoc(conversationsRef, newConversation);
      
      return {
        id: docRef.id,
        ...newConversation,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessage: {
          text: 'Start the conversation!',
          senderId: user.uid,
          timestamp: new Date()
        }
      };
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  };