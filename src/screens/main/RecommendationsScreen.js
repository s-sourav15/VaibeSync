// src/screens/main/RecommendationsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeScreen } from '../../components/layout/SafeScreen';
import CustomButton from '../../components/buttons/CustomButton';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { useRecommendations } from '../../context/RecommendationContext';
import recommendationService from '../../services/recommendationService';

// Activity recommendation card component
const ActivityCard = ({ item, onPress }) => {
  // Format similarity score as percentage
  const similarityPercent = Math.round(item.similarity * 100);
  
  return (
    <TouchableOpacity 
      style={styles.cardContainer} 
      onPress={() => onPress(item.activityId)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>
          {item.activitySnapshot?.title || 'Unnamed Activity'}
        </Text>
        
        <View style={styles.categoryRow}>
          <Text style={styles.categoryText}>
            {item.activitySnapshot?.category || 'Uncategorized'}
          </Text>
          <View style={styles.matchScore}>
            <Icon name="flash" size={14} color="#6366f1" />
            <Text style={styles.matchScoreText}>{similarityPercent}% Match</Text>
          </View>
        </View>
        
        <Text style={styles.locationText}>
          <Icon name="location-outline" size={14} color="#6366f1" /> 
          {item.activitySnapshot?.location || 'No location'}
        </Text>
        
        <Text style={styles.descriptionText} numberOfLines={2}>
          {item.activitySnapshot?.description || 'No description provided'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Tab buttons component
const TabButtons = ({ activeTab, setActiveTab }) => {
  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'for-you' && styles.activeTabButton]}
        onPress={() => setActiveTab('for-you')}
      >
        <Icon name="heart-outline" size={18} color={activeTab === 'for-you' ? '#6366f1' : '#666'} />
        <Text style={[styles.tabButtonText, activeTab === 'for-you' && styles.activeTabButtonText]}>
          For You
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'search' && styles.activeTabButton]}
        onPress={() => setActiveTab('search')}
      >
        <Icon name="search-outline" size={18} color={activeTab === 'search' ? '#6366f1' : '#666'} />
        <Text style={[styles.tabButtonText, activeTab === 'search' && styles.activeTabButtonText]}>
          Natural Language
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Natural language search component
const NaturalLanguageSearch = ({ onSubmit, loading }) => {
  const [text, setText] = useState('');
  
  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text);
    }
  };
  
  const examples = [
    "I want to find outdoor activities for this weekend",
    "Looking for group fitness classes in the morning",
    "Technology workshops that are beginner-friendly",
    "Social events with food and music in the evening",
  ];
  
  return (
    <View style={styles.nlContainer}>
      <Text style={styles.nlTitle}>
        Describe what you're looking for
      </Text>
      
      <TextInput
        style={styles.nlInput}
        placeholder="E.g., outdoor activities this weekend..."
        value={text}
        onChangeText={setText}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
      
      <CustomButton
        title={loading ? "Searching..." : "Find Activities"}
        onPress={handleSubmit}
        style={styles.nlButton}
        disabled={loading || !text.trim()}
      />
      
      <Text style={styles.examplesTitle}>Examples:</Text>
      <View style={styles.examplesContainer}>
        {examples.map((example, index) => (
          <TouchableOpacity
            key={index}
            style={styles.exampleButton}
            onPress={() => setText(example)}
          >
            <Text style={styles.exampleText}>{example}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Main recommendations screen
const RecommendationsScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  const { recommendedActivities, loading: recommendationsLoading } = useRecommendations();
  
  const [activeTab, setActiveTab] = useState('for-you');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localRecommendations, setLocalRecommendations] = useState([]);
  
  // Load initial recommendations with a delay to ensure auth is ready
  useEffect(() => {
    const loadInitialData = async () => {
      // Add delay to ensure auth is ready
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      try {
        console.log('Starting to fetch recommendations...');
        setLoading(true);
        
        const testResult = await recommendationService.generateEmbeddingsTest();
        console.log('Test embedding generation result:', testResult);
        // generating embeddings for the users and activities in the DB
        // console.log('Generating embeddings for all users and activities...');
        // const generationResult = await recommendationService.generateAllEmbeddings();
        // console.log('Embedding generation result:', generationResult);
        // Check connection with auth
        const connected = await recommendationService.checkConnection();
        console.log('API connection status:', connected);
        
        if (connected) {
          const recommendations = await recommendationService.getRecommendedActivities(20);
          console.log('Received recommendations:', recommendations.length);
          setLocalRecommendations(recommendations);
        }
      } catch (error) {
        console.error('Error loading initial recommendations:', error);
        setError('Failed to load recommendations. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (activeTab === 'for-you' && currentUser) {
      loadInitialData();
    }
  }, [activeTab, currentUser]);
  
  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    
    try {
      // Update profile embedding
      if (activeTab === 'for-you') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await recommendationService.updateProfileEmbedding();
        
        // Fetch fresh recommendations
        const recommendations = await recommendationService.getRecommendedActivities(20);
        setLocalRecommendations(recommendations);
      }
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
      setError('Failed to refresh recommendations');
    } finally {
      setRefreshing(false);
    }
  }, [activeTab]);

  // Handle natural language search
  const handleNaturalLanguageSearch = async (text) => {
    if (!text.trim()) return;
    
    try {
      setSearchLoading(true);
      setError(null);
      
      // Add delay to ensure auth is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Starting natural language search...');
      const results = await recommendationService.getRecommendationsByText(text);
      console.log('Search results received:', results.length);
      setSearchResults(results);
      
      // If no results, show a message
      if (results.length === 0) {
        Alert.alert(
          'No Matches Found',
          'We couldn\'t find any activities matching your description. Try using different terms or browse available activities.'
        );
      }
    } catch (error) {
      console.error('Error with natural language search:', error);
      setError('Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Navigate to activity details
  const handleActivityPress = (activityId) => {
    navigation.navigate('ActivityDetails', { activityId });
  };
  
  // Render the empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      {activeTab === 'for-you' ? (
        <>
          <Icon name="heart-outline" size={60} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No recommendations yet</Text>
          <Text style={styles.emptyDescription}>
            Complete your profile to get personalized recommendations
          </Text>
          <CustomButton
            title="Update Your Profile"
            onPress={() => navigation.navigate('EditProfile')}
            style={styles.updateProfileButton}
          />
        </>
      ) : (
        <>
          <Icon name="search-outline" size={60} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Describe What You Want</Text>
          <Text style={styles.emptyDescription}>
            Use natural language to tell us what kind of activities you're looking for
          </Text>
        </>
      )}
    </View>
  );

  // Determine which recommendations to show
  const displayRecommendations = activeTab === 'for-you' 
    ? (localRecommendations.length > 0 ? localRecommendations : recommendedActivities) 
    : [];

  return (
    <SafeScreen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Recommendations</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing || loading}
          >
            <Icon name="refresh-outline" size={20} color="#6366f1" />
          </TouchableOpacity>
        </View>
        
        <TabButtons activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {activeTab === 'for-you' ? (
          // For You tab content
          loading || recommendationsLoading || refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>Finding activities for you...</Text>
            </View>
          ) : (
            <FlatList
              data={displayRecommendations}
              keyExtractor={(item, index) => item?.activityId || `recommended-${index}`}
              renderItem={({ item }) => (
                <ActivityCard item={item} onPress={handleActivityPress} />
              )}
              ListEmptyComponent={renderEmptyState}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={['#6366f1']}
                  tintColor="#6366f1"
                />
              }
            />
          )
        ) : (
          // Search tab content
          <View style={styles.searchTabContent}>
            <NaturalLanguageSearch
              onSubmit={handleNaturalLanguageSearch}
              loading={searchLoading}
            />
            
            {searchLoading ? (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>
                  Finding activities that match your description...
                </Text>
              </View>
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                keyExtractor={(item, index) => item?.activityId || `search-${index}`}
                renderItem={({ item }) => (
                  <ActivityCard item={item} onPress={handleActivityPress} />
                )}
                contentContainerStyle={styles.searchResultsList}
              />
            ) : null}
          </View>
        )}
        
        {error && (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle-outline" size={24} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f5ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 4,
  },
  activeTabButtonText: {
    color: '#6366f1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
    minHeight: 300,
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    color: '#6366f1',
    fontWeight: '600',
    fontSize: 14,
  },
  matchScore: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f5ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  matchScoreText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4b5563',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  updateProfileButton: {
    backgroundColor: '#6366f1',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    margin: 16,
  },
  errorText: {
    color: '#ef4444',
    marginLeft: 8,
    fontSize: 14,
  },
  // Natural language search styles
  searchTabContent: {
    flex: 1,
  },
  nlContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  nlTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  nlInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  nlButton: {
    backgroundColor: '#6366f1',
    marginBottom: 16,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  examplesContainer: {
    marginBottom: 8,
  },
  exampleButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  exampleText: {
    color: '#4b5563',
    fontSize: 14,
  },
  searchLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  searchResultsList: {
    padding: 16,
  },
});

export default RecommendationsScreen;