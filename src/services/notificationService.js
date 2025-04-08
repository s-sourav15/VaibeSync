// src/services/notificationService.js
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    serverTimestamp,
    updateDoc,
    doc
  } from 'firebase/firestore';
  import { db, auth } from '../config/firebase';
  
  /**
   * Get all notifications for the current user
   * @param {boolean} unreadOnly - Whether to only return unread notifications
   * @returns {Promise<Array>} Array of notifications
   */
  export const getNotifications = async (unreadOnly = false) => {
    try {
      const user = auth.currentUser;
      if (!user) return [];
      
      const notificationsRef = collection(db, 'users', user.uid, 'notifications');
      
      let q;
      if (unreadOnly) {
        q = query(notificationsRef, where('read', '==', false), orderBy('createdAt', 'desc'));
      } else {
        q = query(notificationsRef, orderBy('createdAt', 'desc'));
      }
      
      const querySnapshot = await getDocs(q);
      
      const notifications = [];
      querySnapshot.forEach(doc => {
        notifications.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return notifications;
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  };
  
  /**
   * Mark a notification as read
   * @param {string} notificationId - ID of the notification
   * @returns {Promise<boolean>} Success status
   */
  export const markNotificationAsRead = async (notificationId) => {
    try {
      const user = auth.currentUser;
      if (!user) return false;
      
      const notificationRef = doc(db, 'users', user.uid, 'notifications', notificationId);
      
      await updateDoc(notificationRef, {
        read: true,
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  };
  
  /**
   * Mark all notifications as read
   * @returns {Promise<boolean>} Success status
   */
  export const markAllNotificationsAsRead = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return false;
      
      const unreadNotifications = await getNotifications(true);
      
      // Update each notification
      for (const notification of unreadNotifications) {
        const notificationRef = doc(db, 'users', user.uid, 'notifications', notification.id);
        await updateDoc(notificationRef, {
          read: true,
          updatedAt: serverTimestamp()
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  };
  
  /**
   * Create a notification for a user
   * @param {string} userId - User ID to create notification for
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Object} data - Additional data
   * @returns {Promise<boolean>} Success status
   */
  export const createNotification = async (userId, title, body, data = {}) => {
    try {
      if (!userId) return false;
      
      const notificationsRef = collection(db, 'users', userId, 'notifications');
      
      await addDoc(notificationsRef, {
        title,
        body,
        data,
        read: false,
        createdAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  };
  
  /**
   * Get the count of unread notifications
   * @returns {Promise<number>} Count of unread notifications
   */
  export const getUnreadNotificationCount = async () => {
    try {
      const unreadNotifications = await getNotifications(true);
      return unreadNotifications.length;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  };
  
  /**
   * Create a chat message notification
   * @param {string} userId - User ID to notify
   * @param {string} senderName - Name of message sender
   * @param {string} messagePreview - Preview of the message
   * @param {string} conversationId - ID of the conversation
   * @returns {Promise<boolean>} Success status
   */
  export const createChatNotification = async (userId, senderName, messagePreview, conversationId) => {
    return createNotification(
      userId,
      `New message from ${senderName}`,
      messagePreview,
      {
        type: 'chat',
        conversationId
      }
    );
  };
  
  /**
   * Create an activity invitation notification
   * @param {string} userId - User ID to notify
   * @param {string} activityName - Name of the activity
   * @param {string} activityId - ID of the activity
   * @returns {Promise<boolean>} Success status
   */
  export const createActivityInviteNotification = async (userId, activityName, activityId) => {
    return createNotification(
      userId,
      'Activity Invitation',
      `You've been invited to join ${activityName}`,
      {
        type: 'activity_invite',
        activityId
      }
    );
  };
  
  /**
   * Create a match request notification
   * @param {string} userId - User ID to notify
   * @param {string} senderName - Name of request sender
   * @param {string} matchId - ID of the match
   * @returns {Promise<boolean>} Success status
   */
  export const createMatchRequestNotification = async (userId, senderName, matchId) => {
    return createNotification(
      userId,
      'New Match Request',
      `${senderName} wants to connect with you`,
      {
        type: 'match_request',
        matchId
      }
    );
  };