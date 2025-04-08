// src/screens/main/MatchesScreen.js
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
import {
  getRecommendedMatches,
  getMutualMatches,
  getPendingMatchRequests,
  createMatchRequest,
  respondToMatchRequest
} from '../../services/matchingService';
import { createConversation } from '../../services/chatService';

// Tab component for the view selector
const MatchTab = ({ title, active, onPress, count }) => (
  <TouchableOpacity
    style={[styles.tab, active && styles.activeTab]}
    onPress={onPress}
  >
    <Text style={[styles.tabText, active && styles.activeTabText]}>
      {title}
    </Text>
    {count > 0 && (
      <View style={styles.tabBadge}>
        <Text style={styles.tabBadgeText}>{count}</Text>
      </View>
    )}
  </TouchableOpacity>
);

// Recommendation card component
const RecommendationCard = ({ recommendation, onAccept, onReject }) => {
  // Format match score as percentage
  const scorePercent = Math.min(100, Math.round(recommendation.score));
  
  // Format score text based on match quality
  const getScoreColor = () => {
    switch (recommendation.matchQuality) {
      case 'high':
        return '#16a34a'; // Green
      case 'medium':
        return '#f59e0b'; // Amber
      case 'low':
        return '#6b7280'; // Gray
      default:
        return '#6b7280';
    }
  };
  
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: recommendation.user.photoURL || 'https://via.placeholder.com/100' }}
        style={styles.profileImage}
      />
      
      <View style={styles.cardContent}>
        <View style={styles.nameRow}>
          <Text style={styles.userName}>{recommendation.user.displayName || 'User'}</Text>
          <View style={[styles.scoreContainer, { backgroundColor: getScoreColor() }]}>
            <Text style={styles.scoreText}>{scorePercent}%</Text>
          </View>
        </View>
        
        {recommendation.user.location && (
          <View style={styles.infoRow}>
            <Icon name="location-outline" size={16} color="#6366f1" />
            <Text style={styles.locationText}>{recommendation.user.location}</Text>
          </View>
        )}
        
        {recommendation.details.matchingInterests.length > 0 && (
          <View style={styles.interestsContainer}>
            {recommendation.details.matchingInterests.slice(0, 3).map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
            {recommendation.details.matchingInterests.length > 3 && (
              <Text style={styles.moreText}>+{recommendation.details.matchingInterests.length - 3} more</Text>
            )}
          </View>
        )}
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={onReject}
          >
            <Icon name="close" size={24} color="#ef4444" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={onAccept}
          >
            <Icon name="checkmark" size={24} color="#16a34a" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Match card component for connections and requests
const MatchCard = ({ match, onMessage, onAccept, onReject, isPending }) => {
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: match.otherUser.photoURL || 'https://via.placeholder.com/100' }}
        style={styles.profileImage}
      />
      
      <View style={styles.cardContent}>
        <View style={styles.nameRow}>
          <Text style={styles.userName}>{match.otherUser.displayName || 'User'}</Text>
          <View style={[
            styles.scoreContainer,
            { backgroundColor: match.matchQuality === 'high' ? '#16a34a' : 
                             match.matchQuality === 'medium' ? '#f59e0b' : '#6b7280' }
          ]}>
            <Text style={styles.scoreText}>{Math.round(match.score)}%</Text>
          </View>
        </View>
        
        {match.otherUser.location && (
          <View style={styles.infoRow}>
            <Icon name="location-outline" size={16} color="#6366f1" />
            <Text style={styles.locationText}>{match.otherUser.location}</Text>
          </View>
        )}
        
        {isPending && (
          <Text style={styles.pendingText}>
            {match.isIncoming ? 'Wants to connect with you' : 'Waiting for response'}
          </Text>
        )}
        
        {isPending && match.isIncoming ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={onReject}
            >
              <Icon name="close" size={24} color="#ef4444" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={onAccept}
            >
              <Icon name="checkmark" size={24} color="#16a34a" />
            </TouchableOpacity>
          </View>
        ) : isPending ? (
          <View style={styles.pendingStatus}>
            <Icon name="time-outline" size={16} color="#6b7280" />
            <Text style={styles.pendingStatusText}>Pending</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.messageButton}
            onPress={onMessage}
          >
            <Icon name="chatbubbles-outline" size={16} color="#fff" />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Main MatchesScreen component
const MatchesScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('discover');
  const [recommendations, setRecommendations] = useState([]);
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Load data when screen mounts
  useEffect(() => {
    loadData();
  }, []);
  
  // Load all match data
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load recommendations
      const recommendationsData = await getRecommendedMatches();
      setRecommendations(recommendationsData);
      
      // Load mutual matches (connections)
      const connectionsData = await getMutualMatches();
      setConnections(connectionsData);
      
      // Load pending requests
      const pendingData = await getPendingMatchRequests();
      setPendingRequests(pendingData);
    } catch (error) {
      console.error('Error loading match data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle accepting a recommendation
  const handleAcceptRecommendation = async (recommendation) => {
    try {
      await createMatchRequest(recommendation.user.id, recommendation);
      
      // Remove from recommendations and reload data
      setRecommendations(
        recommendations.filter(r => r.user.id !== recommendation.user.id)
      );
      
      // Refresh pending requests
      const pendingData = await getPendingMatchRequests();
      setPendingRequests(pendingData);
    } catch (error) {
      console.error('Error accepting recommendation:', error);
    }
  };
  
  // Handle rejecting a recommendation
  const handleRejectRecommendation = (recommendation) => {
    // For now, just remove from the list
    setRecommendations(
      recommendations.filter(r => r.user.id !== recommendation.user.id)
    );
  };
  
  // Handle accepting a pending request
  const handleAcceptRequest = async (match) => {
    try {
      await respondToMatchRequest(match.id, true);
      
      // Reload connections and pending requests
      const connectionsData = await getMutualMatches();
      setConnections(connectionsData);
      
      const pendingData = await getPendingMatchRequests();
      setPendingRequests(pendingData);
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };
  
  // Handle rejecting a pending request
  const handleRejectRequest = async (match) => {
    try {
      await respondToMatchRequest(match.id, false);
      
      // Reload pending requests
      const pendingData = await getPendingMatchRequests();
      setPendingRequests(pendingData);
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };
  
  // Handle sending a message to a connection
  const handleMessageConnection = async (match) => {
    try {
      // Create or get conversation
      const conversation = await createConversation(match.otherUser.id);
      
      // Navigate to chat screen
      navigation.navigate('ChatScreen', {
        conversationId: conversation.id,
        otherUser: match.otherUser
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };
  
  // Get content for current tab
  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      );
    }
    
    switch (activeTab) {
      case 'discover':
        return (
          <FlatList
            data={recommendations}
            keyExtractor={(item, index) => `recommendation-${item.user.id || index}`}
            renderItem={({ item }) => (
              <RecommendationCard
                recommendation={item}
                onAccept={() => handleAcceptRecommendation(item)}
                onReject={() => handleRejectRecommendation(item)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="search-outline" size={60} color="#ccc" />
                <Text style={styles.emptyTitle}>No Recommendations</Text>
                <Text style={styles.emptyText}>Update your profile and join activities to get better matches</Text>
              </View>
            }
          />
        );
        
      case 'connections':
        return (
          <FlatList
            data={connections}
            keyExtractor={(item) => `connection-${item.id}`}
            renderItem={({ item }) => (
              <MatchCard
                match={item}
                onMessage={() => handleMessageConnection(item)}
                isPending={false}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="people-outline" size={60} color="#ccc" />
                <Text style={styles.emptyTitle}>No Connections Yet</Text>
                <Text style={styles.emptyText}>Discover and connect with others to build your network</Text>
              </View>
            }
          />
        );
        
      case 'requests':
        return (
          <FlatList
            data={pendingRequests}
            keyExtractor={(item) => `request-${item.id}`}
            renderItem={({ item }) => (
              <MatchCard
                match={item}
                onAccept={() => handleAcceptRequest(item)}
                onReject={() => handleRejectRequest(item)}
                isPending={true}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="time-outline" size={60} color="#ccc" />
                <Text style={styles.emptyTitle}>No Pending Requests</Text>
                <Text style={styles.emptyText}>You don't have any pending match requests at the moment</Text>
              </View>
            }
          />
        );
        
      default:
        return null;
    }
  };
  
  return (
    <SafeScreen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Matches</Text>
        </View>
        
        <View style={styles.tabContainer}>
          <MatchTab
            title="Discover"
            active={activeTab === 'discover'}
            onPress={() => setActiveTab('discover')}
            count={recommendations.length}
          />
          <MatchTab
            title="Connections"
            active={activeTab === 'connections'}
            onPress={() => setActiveTab('connections')}
            count={connections.length}
          />
          <MatchTab
            title="Requests"
            active={activeTab === 'requests'}
            onPress={() => setActiveTab('requests')}
            count={pendingRequests.length}
          />
        </View>
        
        <View style={styles.content}>
          {renderTabContent()}
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#6366f1',
    fontWeight: 'bold',
  },
  tabBadge: {
    position: 'absolute',
    top: 6,
    right: '30%',
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
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
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    color: '#6b7280',
    marginLeft: 6,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  interestTag: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    color: '#6366f1',
    fontSize: 12,
  },
  moreText: {
    alignSelf: 'center',
    color: '#6b7280',
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  acceptButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  rejectButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  messageButton: {
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  messageButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 6,
  },
  pendingText: {
    color: '#6b7280',
    fontStyle: 'italic',
    marginVertical: 8,
  },
  pendingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  pendingStatusText: {
    color: '#6b7280',
    marginLeft: 6,
    fontStyle: 'italic',
  },
});

export default MatchesScreen;