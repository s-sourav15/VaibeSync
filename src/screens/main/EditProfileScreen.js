// src/screens/main/EditProfileScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeScreen } from '../../components/layout/SafeScreen';
import CustomInput from '../../components/inputs/CustomInput';
import CustomButton from '../../components/buttons/CustomButton';
import ProfilePhotoUploader from '../../components/profile/ProfilePhotoUploader';
import { getCurrentUserProfile, updateUserProfile } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { showNetworkErrorIfOffline } from '../../utils/network';

const EditProfileScreen = ({ navigation, route }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    displayName: '',
    bio: '',
    location: '',
    interests: [],
    photoURL: '',
  });
  const [interestsInput, setInterestsInput] = useState('');
  const [errors, setErrors] = useState({});

  // Fetch the current profile data when the screen loads
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userData = await getCurrentUserProfile();
      
      if (userData) {
        setProfile({
          displayName: userData.displayName || '',
          bio: userData.bio || '',
          location: userData.location || '',
          interests: userData.interests || [],
          photoURL: userData.photoURL || currentUser?.photoURL || '',
        });
        
        // Join interests array into comma-separated string for the input field
        setInterestsInput(userData.interests ? userData.interests.join(', ') : '');
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      Alert.alert(
        'Error',
        'Failed to load profile data. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpdated = (newPhotoURL) => {
    setProfile(prev => ({ ...prev, photoURL: newPhotoURL }));
  };

  const validateInputs = () => {
    const newErrors = {};
    
    if (!profile.displayName.trim()) {
      newErrors.displayName = 'Name is required';
    }
    
    // Additional validation can be added here
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateInputs()) {
      return;
    }
    
    // Check if device is online before attempting to update
    const isOnline = await showNetworkErrorIfOffline();
    if (!isOnline) return;
    
    try {
      setSaving(true);
      
      // Parse interests from comma-separated string to array
      const interestsArray = interestsInput
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      // Prepare data for update
      const updatedProfile = {
        ...profile,
        interests: interestsArray,
      };
      
      await updateUserProfile(updatedProfile);
      
      Alert.alert(
        'Success',
        'Your profile has been updated successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      
      Alert.alert(
        'Error',
        error.message || 'Failed to update profile. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeScreen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading profile data...</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Edit Profile</Text>
          <Text style={styles.subtitle}>Update Your Profile</Text>
          
          {/* Photo Uploader */}
          <ProfilePhotoUploader 
            photoURL={profile.photoURL} 
            onPhotoUpdated={handlePhotoUpdated} 
          />
          
          <View style={styles.form}>
            <CustomInput
              label="Name"
              placeholder="Enter your name"
              value={profile.displayName}
              onChangeText={(text) => {
                setProfile(prev => ({ ...prev, displayName: text }));
                setErrors(prev => ({ ...prev, displayName: '' }));
              }}
              error={errors.displayName}
            />
            
            <CustomInput
              label="Bio"
              placeholder="Write a short bio about yourself"
              value={profile.bio}
              onChangeText={(text) => setProfile(prev => ({ ...prev, bio: text }))}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={styles.bioInput}
            />
            
            <CustomInput
              label="Location"
              placeholder="Add your location"
              value={profile.location}
              onChangeText={(text) => setProfile(prev => ({ ...prev, location: text }))}
            />
            
            <CustomInput
              label="Interests"
              placeholder="Add interests separated by commas"
              value={interestsInput}
              onChangeText={setInterestsInput}
              helperText="Example: hiking, reading, travel, photography"
            />
            
            {profile.interests && profile.interests.length > 0 && (
              <View style={styles.interestsPreview}>
                <Text style={styles.previewLabel}>Current Interests:</Text>
                <View style={styles.interestTags}>
                  {profile.interests.map((interest, index) => (
                    <View key={index} style={styles.interestTag}>
                      <Text style={styles.interestText}>{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            <View style={styles.buttonContainer}>
              {saving ? (
                <ActivityIndicator size="large" color="#6366f1" style={styles.savingIndicator} />
              ) : (
                <CustomButton
                  title="Save Changes"
                  onPress={handleSave}
                  style={styles.saveButton}
                />
              )}
              
              <CustomButton
                title="Cancel"
                onPress={() => navigation.goBack()}
                style={styles.cancelButton}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  bioInput: {
    height: 100,
    paddingTop: 10,
  },
  interestsPreview: {
    marginTop: 10,
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: '#666',
  },
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestTag: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#6366f1',
  },
  cancelButton: {
    backgroundColor: '#9ca3af',
    marginTop: 10,
  },
  savingIndicator: {
    marginVertical: 15,
  },
});

export default EditProfileScreen;