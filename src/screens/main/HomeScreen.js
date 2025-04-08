// src/screens/main/HomeScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput
} from 'react-native';
import { SafeScreen } from '../../components/layout/SafeScreen';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNetworkStatus } from '../../utils/network';
import { useActivities } from '../../context/ActivityContext';
import { useRecommendations } from '../../context/RecommendationContext';
import CustomButton from '../../components/buttons/CustomButton';

// Filter categories
const CATEGORIES = [
  'All',
  'Fitness',
  'Outdoors',
  'Sports',
  'Education',
  'Arts & Crafts',
  'Social',
  'Technology',
  'Food & Drink',
  'Music'
];

// Activity Card Component
const ActivityCard = ({ activity, onPress, showMatchScore = false }) => {
  if (!activity) return null;
  
  const date = new Date(activity.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric', 
    year: 'numeric'
  });
  
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Format similarity score as percentage if available
  const similarityPercent = activity.similarity ? 
    Math.round(activity.similarity * 100) : null;

  return (
    <TouchableOpacity 
      style={styles.cardContainer} 
      onPress={() => onPress(activity)}
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: activity?.imageUrl }} 
        style={styles.cardImage}
        defaultSource={require('../../assets/placeholder.png')}
      />
      
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardCategory}>{activity?.category || 'Uncategorized'}</Text>
          <View style={styles.participantsContainer}>
            {showMatchScore && similarityPercent ? (
              <View style={styles.matchScoreContainer}>
                <Icon name="flash" size={14} color="#6366f1" />
                <Text style={styles.matchScoreText}>{similarityPercent}% Match</Text>
              </View>
            ) : (
              <>
                <Icon name="people" size={14} color="#666" />
                <Text style={styles.cardParticipants}> 
                  {activity?.currentParticipants || 0}/{activity?.maxParticipants || 0}
                </Text>
              </>
            )}
          </View>
        </View>
        
        <Text style={styles.cardTitle}>{activity?.title || 'Untitled Activity'}</Text>
        
        <View style={styles.cardDetail}>
          <Icon name="location" size={16} color="#6366f1" />
          <Text style={styles.cardDetailText}>{activity?.location || 'No location'}</Text>
        </View>
        
        <View style={styles.cardDetail}>
          <Icon name="calendar" size={16} color="#6366f1" />
          <Text style={styles.cardDetailText}>{formattedDate} at {formattedTime}</Text>
        </View>
        
        <View style={styles.hostContainer}>
          <Image 
            source={{ uri: activity?.host?.photoURL || 'https://source.unsplash.com/random/100x100/?portrait' }} 
            style={styles.hostImage}
            defaultSource={require('../../assets/placeholder.png')}
          />
          <Text style={styles.hostName}>Hosted by {activity?.host?.name || 'Unknown Host'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Section Header Component
const SectionHeader = ({ title, onSeeAllPress, buttonTitle = 'See All' }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {onSeeAllPress && (
      <TouchableOpacity onPress={onSeeAllPress}>
        <Text style={styles.seeAllButton}>{buttonTitle}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// Category Filter Component
const CategoryFilter = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <View style={styles.categoriesContainer}>
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item, index) => `category-${item}-${index}`}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === item && styles.categoryButtonSelected
            ]}
            onPress={() => onSelectCategory(item)}
            activeOpacity={0.7}
          >
            <Text 
              style={[
                styles.categoryButtonText,
                selectedCategory === item && styles.categoryButtonTextSelected
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

// Natural Language Input Component
const NaturalLanguageInput = ({ onSubmit, loading }) => {
  const [text, setText] = useState('');
  
  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text);
      setText(''); // Clear input after submit
    }
  };
  
  return (
    <View style={styles.nlInputContainer}>
      <TextInput
        style={styles.nlInput}
        placeholder="Describe what you're looking for..."
        value={text}
        onChangeText={setText}
        multiline
        numberOfLines={2}
        textAlignVertical="top"
        returnKeyType="done"
      />
      <CustomButton
        title={loading ? "Finding..." : "Find Activities"}
        onPress={handleSubmit}
        style={styles.nlSubmitButton}
        disabled={!text.trim() || loading}
      />
    </View>
  );
};

// Main HomeScreen Component
const HomeScreen = ({ navigation }) => {
  // Get activities from context
  const { activities, loading: activitiesLoading } = useActivities();
  
  // Get recommendations from context
  const { 
    recommendedActivities, 
    loading: recommendationsLoading,
    fetchRecommendedActivities,
    searchActivitiesByText
  } = useRecommendations();
  
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [nlResults, setNlResults] = useState([]);
  const [nlLoading, setNlLoading] = useState(false);
  const [showNlResults, setShowNlResults] = useState(false);
  const { isConnected } = useNetworkStatus();

  // Filter activities based on selected category
  useEffect(() => {
    if (!activities || activities.length === 0) {
      setFilteredActivities([]);
      return;
    }
    
    let result = [...activities];
    
    // Filter by category
    if (selectedCategory !== 'All') {
      result = result.filter(activity => activity?.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(activity => 
        (activity?.title || '').toLowerCase().includes(query) ||
        (activity?.description || '').toLowerCase().includes(query) ||
        (activity?.location || '').toLowerCase().includes(query) ||
        (activity?.category || '').toLowerCase().includes(query)
      );
    }
    
    setFilteredActivities(result);
  }, [selectedCategory, searchQuery, activities]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    
    try {
      // Refresh recommendations
      await fetchRecommendedActivities();
      
      // Reset UI state
      setShowNlResults(false);
      setNlResults([]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchRecommendedActivities]);

  // Handle activity press - Navigate to activity details
  const handleActivityPress = (activity) => {
    if (activity && activity.id) {
      navigation.navigate('ActivityDetails', { activityId: activity.id });
    }
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  // Handle natural language search
  const handleNaturalLanguageSearch = async (text) => {
    if (!text.trim()) return;
    
    setNlLoading(true);
    
    try {
      const results = await searchActivitiesByText(text);
      setNlResults(results);
      setShowNlResults(true);
    } catch (error) {
      console.error('Error with natural language search:', error);
    } finally {
      setNlLoading(false);
    }
  };

  // Navigate to create activity screen
  const handleCreateActivity = () => {
    navigation.navigate('CreateActivity');
  };

  // Clear search query
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Loading state
  const isLoading = (activitiesLoading || recommendationsLoading) && !refreshing;
  if (isLoading) {
    return (
      <SafeScreen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      </SafeScreen>
    );
  }

  // Render recommended activities section
  const renderRecommendedSection = () => {
    if (recommendedActivities.length === 0) {
      return (
        <View style={styles.emptyRecommendationsContainer}>
          <Text style={styles.emptyRecommendationsText}>
            No personalized recommendations available yet.
          </Text>
          <TouchableOpacity 
            style={styles.updateProfileButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.updateProfileButtonText}>
              Complete your profile to get recommendations
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <FlatList
        horizontal
        data={recommendedActivities}
        keyExtractor={(item) => `recommended-${item.id}`}
        renderItem={({ item }) => (
          <View style={styles.recommendedCard}>
            <ActivityCard
              activity={item}
              onPress={handleActivityPress}
              showMatchScore={true}
            />
          </View>
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recommendedList}
      />
    );
  };

  return (
    <SafeScreen>
      <View style={styles.container}>
        {/* Header with title and create button */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Discover Activities</Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={handleCreateActivity}
            activeOpacity={0.8}
          >
            <Icon name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Natural language input */}
        <NaturalLanguageInput 
          onSubmit={handleNaturalLanguageSearch}
          loading={nlLoading}
        />

        {/* Main content */}
        {showNlResults ? (
          // Show natural language search results
          <View style={styles.nlResultsContainer}>
            <View style={styles.nlResultsHeader}>
              <Text style={styles.nlResultsTitle}>Search Results</Text>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setShowNlResults(false)}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={nlResults}
              keyExtractor={(item) => `nl-${item.id}`}
              renderItem={({ item }) => (
                <ActivityCard 
                  activity={item} 
                  onPress={handleActivityPress}
                  showMatchScore={true}
                />
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon name="search-outline" size={60} color="#ccc" />
                  <Text style={styles.emptyText}>No matching activities found</Text>
                  <Text style={styles.emptySubText}>
                    Try a different description or browse available activities
                  </Text>
                </View>
              }
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
          </View>
        ) : (
          // Show regular home screen content
          <FlatList
            data={filteredActivities}
            keyExtractor={(item) => `activity-${item.id}`}
            renderItem={({ item }) => (
              <ActivityCard activity={item} onPress={handleActivityPress} />
            )}
            ListHeaderComponent={
              <>
                {/* Offline notice */}
                {!isConnected && (
                  <View style={styles.offlineNotice}>
                    <Icon name="cloud-offline" size={18} color="#fff" />
                    <Text style={styles.offlineText}>
                      You are offline. Some content may be unavailable.
                    </Text>
                  </View>
                )}
                
                {/* Recommended activities section */}
                <SectionHeader 
                  title="Recommended for You" 
                  onSeeAllPress={() => navigation.navigate('Recommendations')}
                />
                
                {renderRecommendedSection()}
                
                {/* Browse categories section */}
                <SectionHeader title="Browse Activities" />
                
                {/* Category filter */}
                <CategoryFilter 
                  categories={CATEGORIES}
                  selectedCategory={selectedCategory}
                  onSelectCategory={handleCategorySelect}
                />
              </>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="calendar-outline" size={60} color="#ccc" />
                <Text style={styles.emptyText}>No activities found</Text>
                <Text style={styles.emptySubText}>
                  {searchQuery 
                    ? "Try a different search term or category" 
                    : "Check back later for new activities"}
                </Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={5}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#6366f1']}
                tintColor="#6366f1"
              />
            }
          />
        )}
      </View>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#6366f1',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  categoriesContainer: {
    marginTop: 8,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#f1f5f9',
  },
  categoryButtonSelected: {
    backgroundColor: '#6366f1',
  },
  categoryButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllButton: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
  },
  recommendedList: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  recommendedCard: {
    width: 280,
    marginHorizontal: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardImage: {
    height: 150,
    width: '100%',
    backgroundColor: '#f3f4f6',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardCategory: {
    color: '#6366f1',
    fontWeight: '600',
    fontSize: 14,
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardParticipants: {
    color: '#666',
    fontSize: 14,
  },
  matchScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchScoreText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  cardDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardDetailText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  hostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  hostImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: '#e5e7eb',
  },
  hostName: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
  },
  offlineText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
  nlInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  nlInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  nlSubmitButton: {
    backgroundColor: '#6366f1',
  },
  nlResultsContainer: {
    flex: 1,
  },
  nlResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  nlResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#6366f1',
    fontWeight: '500',
  },
  emptyRecommendationsContainer: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  emptyRecommendationsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  updateProfileButton: {
    backgroundColor: '#e0e7ff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  updateProfileButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default HomeScreen;