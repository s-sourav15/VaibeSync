// src/screens/main/ChatScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeScreen } from '../../components/layout/SafeScreen';
import Icon from 'react-native-vector-icons/Ionicons';
import { getMessages, sendMessage } from '../../services/chatService';
import { auth } from '../../config/firebase';

// Format message timestamp
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Message bubble component
const MessageBubble = ({ message, isCurrentUser }) => {
  return (
    <View style={[
      styles.messageBubbleContainer,
      isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer
    ]}>
      <View style={[
        styles.messageBubble,
        isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
      ]}>
        <Text style={[
          styles.messageText,
          isCurrentUser ? styles.currentUserText : styles.otherUserText
        ]}>
          {message.text}
        </Text>
        <Text style={[
          styles.messageTime,
          isCurrentUser ? styles.currentUserTime : styles.otherUserTime
        ]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
};

// Main ChatScreen component
const ChatScreen = ({ route, navigation }) => {
  const { conversationId, otherUser } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const flatListRef = useRef(null);
  const currentUserId = auth.currentUser?.uid;
  
  // Set the header title to the other user's name
  useEffect(() => {
    navigation.setOptions({
      title: otherUser?.displayName || 'Chat',
    });
  }, [navigation, otherUser]);
  
  // Load messages when the screen mounts
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        const data = await getMessages(conversationId);
        setMessages(data);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMessages();
  }, [conversationId]);
  
  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);
  
  // Send a new message
  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    try {
      setSending(true);
      
      // Add message optimistically to UI
      const tempMessage = {
        id: Date.now().toString(),
        text: inputText,
        senderId: currentUserId,
        timestamp: new Date(),
        read: false,
        pending: true
      };
      
      setMessages([...messages, tempMessage]);
      setInputText('');
      
      // Send to server
      const newMessage = await sendMessage(conversationId, inputText.trim());
      
      // Replace temp message with actual message
      setMessages(prevMessages => prevMessages.map(msg => 
        msg.id === tempMessage.id ? newMessage : msg
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      
      // If error, mark the message as failed
      setMessages(prevMessages => prevMessages.map(msg => 
        msg.id === tempMessage.id ? { ...msg, failed: true } : msg
      ));
    } finally {
      setSending(false);
    }
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isCurrentUser={item.senderId === currentUserId}
            />
          )}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation!</Text>
            </View>
          }
        />
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.disabledButton
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    flexGrow: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  currentUserContainer: {
    justifyContent: 'flex-end',
  },
  otherUserContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  currentUserBubble: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  currentUserText: {
    color: '#fff',
  },
  otherUserText: {
    color: '#000',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  currentUserTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherUserTime: {
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#a5b4fc',
  },
});

export default ChatScreen;