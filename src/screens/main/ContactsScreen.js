// src/screens/main/ContactsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { SafeScreen } from '../../components/layout/SafeScreen';
import Icon from 'react-native-vector-icons/Ionicons';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { searchUsersByName, getUsersFromActivity } from '../../services/userService';

// ContactItem component
const ContactItem = ({ user, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.contactItem} 
      onPress={() => onPress(user)}
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: user.photoURL || 'https://source.unsplash.com/random/100x100/?portrait' }}
        style={styles.avatar}
        defaultSource={require('../../assets/placeholder.png')}
      />
      
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{user.displayName || 'User'}</Text>
        {user.location && (
          <Text style={styles.contactLocation}>{user.location}</Text>
        )}
      </View>
      
      <Icon name="chevron-forward" size={20} color="#94a3b8" />
    </TouchableOpacity>
  );
};

// TabButton component for the segmented control
const TabButton = ({ title, active, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.tabButton, active && styles.activeTabButton]}
      onPress={onPress}
    >
      <Text style={[styles.tabButtonText, active && styles.activeTabButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

// Main ContactsScreen component
const ContactsScreen = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState('activities');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { getOrCreateConversation, setActiveConversation } = useChat();
  const { currentUser } = useAuth();
  
  const activityId = route.params?.activityId;
  
  // Fetch users based on active tab
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (activeTab === 'activities' && activityId) {
          // Get users from a specific activity
          const activityUsers = await getUsersFromActivity(activityId);
          setUsers(activityUsers.filter(user => user.id !== currentUser?.uid));
        } else if (activeTab === 'activities') {
          // Get users from all activities the current user is in
          const activityUsers = await getUsersFromActivity(null, currentUser?.uid);
          setUsers(activityUsers.filter(user => user.id !== currentUser?.uid));
        } else if (activeTab === 'search' && searchQuery.trim().length > 0) {
          // Search users by name
          const searchResults = await searchUsersByName(searchQuery);
          setUsers(searchResults.filter(user => user.id !== currentUser?.uid));
        } else {
          setUsers([]);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [activeTab, searchQuery, activityId, currentUser]);
  
  // Handle starting a conversation with a user
  const handleUserPress = async (user) => {
    try {
      const conversation = await getOrCreateConversation(user.id);
      setActiveConversation(conversation);
      navigation.navigate('Chat', { conversationId: conversation.id });
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };
  
  // Handle search query change
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim().length > 0) {
      setActiveTab('search');
    }
  };
  
  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    if (activeTab === 'search') {
      setActiveTab('activities');
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
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Message</Text>
          <View style={{ width: 32 }} /> {/* Empty view for spacing */}
        </View>
        
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name..."
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearSearch}
            >
              <Icon name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.tabContainer}>
          <TabButton
            title="Activity Members"
            active={activeTab === 'activities'}
            onPress={() => setActiveTab('activities')}
          />
          <TabButton
            title="Search Results"
            active={activeTab === 'search'}
            onPress={() => setActiveTab('search')}
          />
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle-outline" size={40} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="people-outline" size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>
              {activeTab === 'activities' 
                ? 'No members found'
                : 'No users found'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'activities'
                ? 'Join activities to meet and chat with people'
                : 'Try a different search term'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ContactItem user={item} onPress={handleUserPress} />
            )}
            contentContainerStyle={styles.list}
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    margin: 16,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    padding: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTabButton: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  activeTabButtonText: {
    color: '#6366f1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  list: {
    flexGrow: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  contactLocation: {
    fontSize: 14,
    color: '#64748b',
  },
});

export default ContactsScreen;