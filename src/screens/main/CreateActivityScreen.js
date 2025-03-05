// src/screens/main/CreateActivityScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { SafeScreen } from '../../components/layout/SafeScreen';
import CustomInput from '../../components/inputs/CustomInput';
import CustomButton from '../../components/buttons/CustomButton';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { showNetworkErrorIfOffline } from '../../utils/network';

// Categories for dropdown
const CATEGORIES = [
  'Fitness',
  'Outdoors',
  'Sports',
  'Education',
  'Arts & Crafts',
  'Social',
  'Technology',
  'Food & Drink',
  'Music',
  'Other'
];

const CreateActivityScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activity, setActivity] = useState({
    title: '',
    description: '',
    location: '',
    category: '',
    date: new Date(),
    maxParticipants: '10',
    imageUri: null,
  });
  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Format date for display
  const formattedDate = activity.date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  
  const formattedTime = activity.date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Handle category selection
  const handleCategorySelect = (category) => {
    setActivity({ ...activity, category });
    setShowCategoryDropdown(false);
    setErrors({ ...errors, category: '' });
  };

  // Handle date change
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setActivity({ ...activity, date: selectedDate });
    }
  };

  // Handle image selection
  const handleSelectImage = async () => {
    try {
      // Request permissions
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Sorry, we need camera roll permissions to upload an image.',
            [{ text: 'OK' }]
          );
          return;
        }
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setActivity({ ...activity, imageUri: result.assets[0].uri });
        setErrors({ ...errors, image: '' });
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!activity.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!activity.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!activity.location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    if (!activity.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!activity.maxParticipants) {
      newErrors.maxParticipants = 'Maximum participants is required';
    } else if (isNaN(parseInt(activity.maxParticipants))) {
      newErrors.maxParticipants = 'Please enter a valid number';
    }
    
    if (!activity.imageUri) {
      newErrors.image = 'Please upload an image for your activity';
    }
    
    // Check if date is in the future
    if (activity.date < new Date()) {
      newErrors.date = 'Please select a future date and time';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create activity
  const handleCreateActivity = async () => {
    if (!validateForm()) {
      return;
    }
    
    // Check if device is online
    const isOnline = await showNetworkErrorIfOffline();
    if (!isOnline) return;
    
    try {
      setLoading(true);
      
      // For now, just simulate creating an activity
      // In a real app, you would upload the image to Firebase Storage,
      // then create the activity document in Firestore
      
      setTimeout(() => {
        setLoading(false);
        Alert.alert(
          'Success',
          'Your activity has been created!',
          [
            { 
              text: 'OK', 
              onPress: () => navigation.navigate('Home')
            }
          ]
        );
      }, 2000);
      
    } catch (error) {
      console.error('Error creating activity:', error);
      setLoading(false);
      Alert.alert(
        'Error',
        'Failed to create activity. Please try again.'
      );
    }
  };

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Activity</Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.form}>
            {/* Image Uploader */}
            <TouchableOpacity
              style={styles.imageUploader}
              onPress={handleSelectImage}
            >
              {activity.imageUri ? (
                <Image
                  source={{ uri: activity.imageUri }}
                  style={styles.previewImage}
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Icon name="image-outline" size={40} color="#ccc" />
                  <Text style={styles.uploadText}>Upload Activity Image</Text>
                </View>
              )}
            </TouchableOpacity>
            {errors.image && <Text style={styles.errorText}>{errors.image}</Text>}
            
            {/* Title */}
            <CustomInput
              label="Title"
              placeholder="Enter activity title"
              value={activity.title}
              onChangeText={(text) => {
                setActivity({ ...activity, title: text });
                setErrors({ ...errors, title: '' });
              }}
              error={errors.title}
            />
            
            {/* Description */}
            <CustomInput
              label="Description"
              placeholder="Describe your activity"
              value={activity.description}
              onChangeText={(text) => {
                setActivity({ ...activity, description: text });
                setErrors({ ...errors, description: '' });
              }}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={styles.descriptionInput}
              error={errors.description}
            />
            
            {/* Location */}
            <CustomInput
              label="Location"
              placeholder="Enter activity location"
              value={activity.location}
              onChangeText={(text) => {
                setActivity({ ...activity, location: text });
                setErrors({ ...errors, location: '' });
              }}
              error={errors.location}
            />
            
            {/* Category */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Category</Text>
              <TouchableOpacity
                style={[styles.dropdownButton, errors.category && styles.inputError]}
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <Text style={activity.category ? styles.dropdownText : styles.placeholder}>
                  {activity.category || 'Select a category'}
                </Text>
                <Icon name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
              {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
              
              {showCategoryDropdown && (
                <View style={styles.dropdownMenu}>
                  <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 200 }}>
                    {CATEGORIES.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={styles.dropdownItem}
                        onPress={() => handleCategorySelect(category)}
                      >
                        <Text style={styles.dropdownItemText}>{category}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            
            {/* Date and Time */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Date and Time</Text>
              <TouchableOpacity
                style={[styles.dateButton, errors.date && styles.inputError]}
                onPress={() => setShowDatePicker(true)}
              >
                <Icon name="calendar-outline" size={20} color="#6366f1" style={styles.dateIcon} />
                <Text style={styles.dateText}>
                  {formattedDate} at {formattedTime}
                </Text>
              </TouchableOpacity>
              {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
              
              {showDatePicker && (
                <DateTimePicker
                  value={activity.date}
                  mode="datetime"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>
            
            {/* Max Participants */}
            <CustomInput
              label="Maximum Participants"
              placeholder="Enter maximum number of participants"
              value={activity.maxParticipants}
              onChangeText={(text) => {
                setActivity({ ...activity, maxParticipants: text });
                setErrors({ ...errors, maxParticipants: '' });
              }}
              keyboardType="number-pad"
              error={errors.maxParticipants}
            />
            
            {/* Create Button */}
            <View style={styles.buttonContainer}>
              {loading ? (
                <ActivityIndicator size="large" color="#6366f1" style={styles.loader} />
              ) : (
                <CustomButton
                  title="Create Activity"
                  onPress={handleCreateActivity}
                  style={styles.createButton}
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 6,
  },
  placeholder: {
    width: 30,
  },
  form: {
    padding: 16,
  },
  imageUploader: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    marginTop: 8,
    color: '#94a3b8',
    fontSize: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  descriptionInput: {
    height: 100,
    paddingTop: 12,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#27272a',
    fontWeight: '500',
  },
  dropdownButton: {
    backgroundColor: '#f4f4f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  placeholder: {
    color: '#a1a1aa',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownMenu: {
    marginTop: 4,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  dateButton: {
    backgroundColor: '#f4f4f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  dateIcon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    marginTop: 24,
  },
  createButton: {
    backgroundColor: '#6366f1',
  },
  cancelButton: {
    backgroundColor: '#94a3b8',
    marginTop: 12,
  },
  loader: {
    marginVertical: 15,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
  },
});

export default CreateActivityScreen;