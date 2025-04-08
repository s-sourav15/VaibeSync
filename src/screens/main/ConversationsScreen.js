// src/screens/main/ConversationsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { SafeScreen } from '../../components/layout/SafeScreen';
import Icon from 'react-native-vector-icons/Ionicons';
import { getConversations } from '../../services/chatService';
import { auth } from '../../config/firebase';

// Format the timestamp to a readable string
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

// Conversation item component
const ConversationItem = ({ conversation, onPress }) => {
  const { otherUser, lastMessage } = conversation;
  const currentUserId = auth.currentUser?.uid;
  const isCurrentUserSender = lastMessage?.senderId === currentUserId;
  
  return (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => onPress(conversation)}
    >
      <Image
        source={{ uri: otherUser.photoURL || 'https://via.placeholder.com/50' }}
        style={styles.avatar}
      />
      
      <View style={styles.conversationDetails}>
        <View style={styles.conversationHeader}>
          <Text style={styles.userName}>{otherUser.displayName || 'User'}</Text>
          <Text style={styles.timeStamp}>{formatTime(lastMessage?.timestamp)}</Text>
        </View>
        
        <Text style={styles.lastMessage} numberOfLines={1}>
          {isCurrentUserSender ? 'You: ' : ''}{lastMessage?.text || 'Start a conversation'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Main screen component
const ConversationsScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Load conversations when screen mounts
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        const data = await getConversations();
        setConversations(data);
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadConversations();
  }, []);
  
  // Navigate to chat screen when a conversation is selected
  const handleConversationPress = (conversation) => {
    navigation.navigate('ChatScreen', { 
      conversationId: conversation.id,
      otherUser: conversation.otherUser
    });
  };
  
  // Navigate to find users screen
  const handleNewChat = () => {
    navigation.navigate('FindUsersScreen');
  };
  
  if (loading) {
    return (
      <SafeScreen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeScreen>
    );
  }
  
  return (
    <SafeScreen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
          <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
            <Icon name="create-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        {conversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="chatbubbles-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>
              Start chatting with activity participants
            </Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ConversationItem
                conversation={item}
                onPress={handleConversationPress}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
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
  conversationItem: {
    flexDirection: 'row',
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
  conversationDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeStamp: {
    fontSize: 12,
    color: '#666',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
});

export default ConversationsScreen;