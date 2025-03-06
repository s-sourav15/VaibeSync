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

// Export mock data so it can be used by the context
export const MOCK_ACTIVITIES = [
  {
    id: '1',
    title: 'Morning Yoga',
    category: 'Fitness',
    location: 'Central Park',
    date: '2025-03-10T08:00:00',
    description: 'Join us for a refreshing morning yoga session at Central Park. This class is suitable for all levels, from beginners to advanced practitioners. We"ll focus on gentle stretches, breathing techniques, and mindfulness to start your day with positive energy. Please bring your own mat and water bottle.',
    imageUrl: 'https://source.unsplash.com/random/400x300/?yoga',
    maxParticipants: 15,
    currentParticipants: 8,
    participants: [
      {
        id: 'user1',
        name: 'Sarah Johnson',
        photoURL: 'https://source.unsplash.com/random/100x100/?portrait,woman',
      },
      {
        id: 'user2',
        name: 'Michael Chen',
        photoURL: 'https://source.unsplash.com/random/100x100/?portrait,man',
      }
    ],
    host: {
      id: 'host1',
      name: 'Emma Wilson',
      photoURL: 'https://source.unsplash.com/random/100x100/?portrait,woman',
    }
  },
  // Other mock activities (unchanged)
  // ...
];

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
const ActivityCard = ({ activity, onPress }) => {
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

  return (
    <TouchableOpacity 
      style={styles.cardContainer} 
      onPress={() => onPress(activity)}
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: activity.imageUrl }} 
        style={styles.cardImage}
        defaultSource={require('../../assets/placeholder.png')}
      />
      
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardCategory}>{activity.category}</Text>
          <View style={styles.participantsContainer}>
            <Icon name="people" size={14} color="#666" />
            <Text style={styles.cardParticipants}> {activity.currentParticipants}/{activity.maxParticipants}</Text>
          </View>
        </View>
        
        <Text style={styles.cardTitle}>{activity.title}</Text>
        
        <View style={styles.cardDetail}>
          <Icon name="location" size={16} color="#6366f1" />
          <Text style={styles.cardDetailText}>{activity.location}</Text>
        </View>
        
        <View style={styles.cardDetail}>
          <Icon name="calendar" size={16} color="#6366f1" />
          <Text style={styles.cardDetailText}>{formattedDate} at {formattedTime}</Text>
        </View>
        
        <View style={styles.hostContainer}>
          <Image 
            source={{ uri: activity.host.photoURL }} 
            style={styles.hostImage}
          />
          <Text style={styles.hostName}>Hosted by {activity.host.name}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Category Filter Component
const CategoryFilter = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <View style={styles.categoriesContainer}>
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item}
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

// Main HomeScreen Component
const HomeScreen = ({ navigation }) => {
  // Use activities from context instead of local state
  const { activities, loading: contextLoading } = useActivities();
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isConnected } = useNetworkStatus();

  // Update loading state when context loading changes
  useEffect(() => {
    setLoading(contextLoading);
  }, [contextLoading]);

  // Handle refresh - no longer need our own fetch function
  const handleRefresh = async () => {
    setRefreshing(true);
    // We would re-fetch from the context here in a real app
    // For now, just wait a second to simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Filter activities based on selected category and search query
  useEffect(() => {
    let result = activities;
    
    // Filter by category
    if (selectedCategory !== 'All') {
      result = result.filter(activity => activity.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(activity => 
        activity.title.toLowerCase().includes(query) ||
        activity.description.toLowerCase().includes(query) ||
        activity.location.toLowerCase().includes(query) ||
        activity.category.toLowerCase().includes(query)
      );
    }
    
    setFilteredActivities(result);
  }, [selectedCategory, searchQuery, activities]);

  // Handle activity press - Navigate to activity details
  const handleActivityPress = (activity) => {
    navigation.navigate('ActivityDetails', { activityId: activity.id });
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
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
  if (loading && !refreshing) {
    return (
      <SafeScreen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      </SafeScreen>
    );
  }

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
        
        {/* Search bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search activities..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={handleClearSearch}
            >
              <Icon name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        {/* Category filter */}
        <CategoryFilter 
          categories={CATEGORIES}
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />
        
        {/* Offline notice */}
        {!isConnected && (
          <View style={styles.offlineNotice}>
            <Icon name="cloud-offline" size={18} color="#fff" />
            <Text style={styles.offlineText}>You are offline. Some content may be unavailable.</Text>
          </View>
        )}
        
        {/* Activity list or empty state */}
        {filteredActivities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="calendar-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No activities found</Text>
            <Text style={styles.emptySubText}>
              {searchQuery 
                ? "Try a different search term or category" 
                : "Check back later for new activities"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredActivities}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ActivityCard activity={item} onPress={handleActivityPress} />
            )}
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

// Styles remain the same
const styles = StyleSheet.create({
  // All the styles from before
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 16,
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
});

export default HomeScreen;