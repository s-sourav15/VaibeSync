// src/screens/main/NotificationsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { SafeScreen } from '../../components/layout/SafeScreen';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../../services/notificationService';

// Format timestamp to a readable string
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  
  if (diffInHours < 24) {
    // Today, show time
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 48) {
    // Yesterday
    return 'Yesterday';
  } else {
    // Show date
    return date.toLocaleDateString();
  }
};

// Get appropriate icon based on notification type
const getNotificationIcon = (type) => {
  switch (type) {
    case 'chat':
      return 'chatbubble-outline';
    case 'activity_invite':
      return 'calendar-outline';
    case 'match_request':
      return 'people-outline';
    default:
      return 'notifications-outline';
  }
};

// Get icon background color based on notification type
const getIconColor = (type) => {
  switch (type) {
    case 'chat':
      return '#6366f1'; // Purple
    case 'activity_invite':
      return '#f59e0b'; // Amber
    case 'match_request':
      return '#10b981'; // Green
    default:
      return '#6b7280'; // Gray
  }
};

// Notification item component
const NotificationItem = ({ notification, onPress }) => {
  const iconName = getNotificationIcon(notification.data?.type);
  const iconColor = getIconColor(notification.data?.type);
  
  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !notification.read && styles.unreadNotification
      ]}
      onPress={() => onPress(notification)}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
        <Icon name={iconName} size={20} color="#fff" />
      </View>
      
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.notificationTime}>
            {formatTime(notification.createdAt)}
          </Text>
        </View>
        
        <Text style={styles.notificationBody} numberOfLines={2}>
          {notification.body}
        </Text>
      </View>
      
      {!notification.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

// Main NotificationsScreen component
const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  
  // Load notifications when screen mounts
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        const data = await getNotifications();
        setNotifications(data);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadNotifications();
  }, []);
  
  // Handle notification press
  const handleNotificationPress = async (notification) => {
    try {
      // Mark notification as read
      if (!notification.read) {
        await markNotificationAsRead(notification.id);
        
        // Update local state
        setNotifications(prevNotifications =>
          prevNotifications.map(item =>
            item.id === notification.id ? { ...item, read: true } : item
          )
        );
      }
      
      // Navigate based on notification type
      handleNotificationNavigation(notification);
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };
  
  // Navigate based on notification type
  const handleNotificationNavigation = (notification) => {
    const { type, conversationId, activityId, matchId } = notification.data || {};
    
    switch (type) {
      case 'chat':
        navigation.navigate('ChatScreen', { conversationId });
        break;
      case 'activity_invite':
        navigation.navigate('ActivityDetail', { activityId });
        break;
      case 'match_request':
        navigation.navigate('Matches', { screen: 'PendingMatches' });
        break;
      default:
        // Do nothing for unknown types
        break;
    }
  };
  
  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAll(true);
      await markAllNotificationsAsRead();
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(item => ({ ...item, read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setMarkingAll(false);
    }
  };
  
  // Count unread notifications
  const unreadCount = notifications.filter(item => !item.read).length;
  
  return (
    <SafeScreen>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
              disabled={markingAll}
            >
              {markingAll ? (
                <ActivityIndicator size="small" color="#6366f1" />
              ) : (
                <Text style={styles.markAllText}>Mark all as read</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="notifications-off-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>
              You'll be notified about activities, messages and matches
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NotificationItem
                notification={item}
                onPress={handleNotificationPress}
              />
            )}
          />
        )}
      </View>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    color: '#6366f1',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  unreadNotification: {
    backgroundColor: '#f1f5f9',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
  },
  notificationTime: {
    color: '#666',
    fontSize: 12,
    marginLeft: 8,
  },
  notificationBody: {
    color: '#666',
    fontSize: 14,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366f1',
    marginLeft: 8,
  },
});

export default NotificationsScreen;