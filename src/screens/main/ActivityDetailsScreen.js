// src/screens/main/ActivityDetailsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeScreen } from '../../components/layout/SafeScreen';
import CustomButton from '../../components/buttons/CustomButton';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { useActivities } from '../../context/ActivityContext';

const ActivityDetailsScreen = ({ route, navigation }) => {
  const { activityId } = route.params || { activityId: '1' }; // Default ID for testing
  const { currentUser } = useAuth();
  const { getActivityById, joinActivity, leaveActivity } = useActivities();
  
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    fetchActivityDetails();
  }, [activityId]);

  const fetchActivityDetails = () => {
    try {
      setLoading(true);
      const activityData = getActivityById(activityId);
      
      if (activityData) {
        setActivity(activityData);
        
        // Check if current user has already joined
        if (activityData.participants?.some(p => p.id === currentUser?.uid)) {
          setHasJoined(true);
        }
      }
    } catch (error) {
      console.error('Error fetching activity details:', error);
      Alert.alert('Error', 'Failed to load activity details.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinActivity = async () => {
    try {
      setJoining(true);
      
      const user = {
        id: currentUser?.uid || 'guest',
        name: currentUser?.displayName || 'Guest User',
        photoURL: currentUser?.photoURL || 'https://source.unsplash.com/random/100x100/?portrait',
      };
      
      await joinActivity(activityId, user);
      setHasJoined(true);
      
      // Refresh activity details
      fetchActivityDetails();
      
      Alert.alert('Success', 'You have joined this activity!');
    } catch (error) {
      console.error('Error joining activity:', error);
      Alert.alert('Error', 'Failed to join activity. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveActivity = async () => {
    try {
      setJoining(true);
      
      await leaveActivity(activityId, currentUser?.uid || 'guest');
      setHasJoined(false);
      
      // Refresh activity details
      fetchActivityDetails();
      
      Alert.alert('Success', 'You have left this activity.');
    } catch (error) {
      console.error('Error leaving activity:', error);
      Alert.alert('Error', 'Failed to leave activity. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  if (loading) {
    return (
      <SafeScreen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading activity details...</Text>
        </View>
      </SafeScreen>
    );
  }

  if (!activity) {
    return (
      <SafeScreen>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={60} color="#ef4444" />
          <Text style={styles.errorText}>Activity not found</Text>
          <CustomButton 
            title="Go Back" 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          />
        </View>
      </SafeScreen>
    );
  }

  const { date, time } = formatDateTime(activity.date);
  const spotsRemaining = activity.maxParticipants - activity.currentParticipants;

  return (
    <SafeScreen>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <Image 
          source={{ uri: activity.imageUrl }} 
          style={styles.coverImage}
        />
        
        <View style={styles.content}>
          <View style={styles.categoryRow}>
            <Text style={styles.category}>{activity.category}</Text>
            <View style={styles.spotsContainer}>
              <Icon name="people-outline" size={16} color="#6366f1" />
              <Text style={styles.spotsText}>
                {spotsRemaining > 0 
                  ? `${spotsRemaining} spots left` 
                  : 'No spots left'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.title}>{activity.title}</Text>
          
          <View style={styles.infoRow}>
            <Icon name="calendar-outline" size={20} color="#6366f1" />
            <Text style={styles.infoText}>{date}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Icon name="time-outline" size={20} color="#6366f1" />
            <Text style={styles.infoText}>{time}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Icon name="location-outline" size={20} color="#6366f1" />
            <Text style={styles.infoText}>{activity.location}</Text>
          </View>
          
          <View style={styles.hostSection}>
            <Text style={styles.sectionTitle}>Host</Text>
            <View style={styles.hostRow}>
              <Image 
                source={{ uri: activity.host.photoURL }} 
                style={styles.hostImage}
              />
              <Text style={styles.hostName}>{activity.host.name}</Text>
              <CustomButton 
                title="Message" 
                onPress={() => console.log('Message host')}
                style={styles.messageButton}
              />
            </View>
          </View>
          
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About This Activity</Text>
            <Text style={styles.description}>{activity.description}</Text>
          </View>
          
          <View style={styles.participantsSection}>
            <Text style={styles.sectionTitle}>
              Participants ({activity.currentParticipants}/{activity.maxParticipants})
            </Text>
            <View style={styles.participantsList}>
              {activity.participants && activity.participants.length > 0 ? (
                activity.participants.map((participant, index) => (
                  <View key={index} style={styles.participantItem}>
                    <Image 
                      source={{ uri: participant.photoURL }} 
                      style={styles.participantImage}
                    />
                    <Text style={styles.participantName}>{participant.name}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noParticipantsText}>No participants yet. Be the first to join!</Text>
              )}
            </View>
          </View>
          
          <View style={styles.joinButtonContainer}>
            {joining ? (
              <ActivityIndicator size="large" color="#6366f1" />
            ) : hasJoined ? (
              <CustomButton 
                title="Leave Activity" 
                onPress={handleLeaveActivity}
                style={styles.leaveButton}
              />
            ) : (
              <CustomButton 
                title="Join Activity" 
                onPress={handleJoinActivity}
                style={[
                  styles.joinButton,
                  spotsRemaining <= 0 && styles.disabledButton
                ]}
                disabled={spotsRemaining <= 0}
              />
            )}
            {spotsRemaining <= 0 && !hasJoined && (
              <Text style={styles.fullText}>This activity is full</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  header: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 20,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    color: '#6366f1',
    fontWeight: '600',
    fontSize: 16,
  },
  spotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spotsText: {
    marginLeft: 4,
    color: '#6366f1',
    fontWeight: '500',
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  hostSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
  },
  hostImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  hostName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  messageButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  descriptionSection: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  participantsSection: {
    marginBottom: 30,
  },
  participantsList: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  participantImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  participantName: {
    fontSize: 14,
    color: '#333',
  },
  noParticipantsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 10,
  },
  joinButtonContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    width: '100%',
  },
  leaveButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    width: '100%',
  },
  disabledButton: {
    backgroundColor: '#cbd5e1',
  },
  fullText: {
    color: '#ef4444',
    marginTop: 8,
    fontSize: 14,
  },
});

export default ActivityDetailsScreen;