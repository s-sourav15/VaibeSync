// src/screens/main/FindUsersScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { SafeScreen } from '../../components/layout/SafeScreen';
import Icon from 'react-native-vector-icons/Ionicons';
import { getUsersByActivity, searchUsers } from '../../services/userService';
import { createConversation } from '../../services/chatService';
import { auth } from '../../config/firebase';

// User item component
const UserItem = ({ user, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => onPress(user)}
    >
      <Image
        source={{ uri: user.photoURL || 'https://via.placeholder.com/50' }}
        style={styles.avatar}
      />
      
      <View style={styles.userDetails}>
        <Text style={styles.userName}>{user.displayName || 'User'}</Text>
        {user.location && (
          <Text style={styles.userLocation}>{user.location}</Text>
        )}
      </View>
      
      <Icon name="chatbubble-outline" size={20} color="#6366f1" />
    </TouchableOpacity>
  );
};

// Main FindUsersScreen component
const FindUsersScreen = ({ route, navigation }) => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const activityId = route.params?.activityId;
  const currentUserId = auth.currentUser?.uid;
  
  // Load users when screen mounts
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        
        let usersData;
        if (activityId) {
          // Get users from a specific activity
          usersData = await getUsersByActivity(activityId);
        } else {
          // Get all users except current user
          usersData = await searchUsers();
        }
        
        // Filter out current user
        setUsers(usersData.filter(user => user.id !== currentUserId));
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, [activityId, currentUserId]);
  
  // Handle search input
  const handleSearch = async (text) => {
    setSearchQuery(text);
    
    if (text.trim().length > 0) {
      // Search users by name
      setLoading(true);
      try {
        const searchResults = await searchUsers(text);
        setUsers(searchResults.filter(user => user.id !== currentUserId));
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Start or open a conversation with a user
  const handleUserPress = async (user) => {
    try {
      setLoading(true);
      
      // Create or get conversation
      const conversation = await createConversation(user.id);
      
      // Navigate to chat screen
      navigation.navigate('ChatScreen', {
        conversationId: conversation.id,
        otherUser: user
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setLoading(false);
    }
  };
  
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
          <Text style={styles.headerTitle}>
            {activityId ? 'Activity Members' : 'Find People'}
          </Text>
        </View>
        
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery ? (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => handleSearch('')}
            >
              <Icon name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="people-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>
              Try a different search or join activities to meet people
            </Text>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <UserItem
                user={item}
                onPress={handleUserPress}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    margin: 16,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
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
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 14,
    color: '#666',
  },
});

export default FindUsersScreen;