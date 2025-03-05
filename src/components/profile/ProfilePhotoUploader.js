// src/components/profile/ProfilePhotoUploader.js
import React, { useState } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  Platform,
  Text
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { updateUserProfile } from '../../services/userService';

const ProfilePhotoUploader = ({ photoURL, onPhotoUpdated }) => {
  const [uploading, setUploading] = useState(false);

  const selectImage = async () => {
    try {
      const options = {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 800,
        maxWidth: 800,
        quality: 0.7,
      };

      launchImageLibrary(options, async (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          console.log('ImagePicker Error: ', response.errorMessage);
          Alert.alert('Error', 'There was an error selecting the image');
        } else if (response.assets && response.assets.length > 0) {
          const imageUri = response.assets[0].uri;
          await uploadImage(imageUri);
        }
      });
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const uploadImage = async (uri) => {
    try {
      setUploading(true);
      
      // Generate a unique filename using timestamp and random string
      const filename = `profile_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const storage = getStorage();
      
      // Make sure storage is initialized and accessible
      console.log("Storage initialized:", storage);
      
      // Create the reference with proper path
      const storageRef = ref(storage, `profile_photos/${auth.currentUser.uid}/${filename}`);
      console.log("Storage reference created:", storageRef.fullPath);
      
      // Fetch the image and convert to blob
      const response = await fetch(uri);
      const blob = await response.blob();
      console.log("Image blob created, size:", blob.size);
      
      try {
        // Use simpler uploadBytes instead of uploadBytesResumable for troubleshooting
        const snapshot = await uploadBytes(storageRef, blob);
        console.log("Upload successful:", snapshot);
        
        // Get the download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log("Download URL obtained:", downloadURL);
        
        // Update Firebase Auth profile
        await updateProfile(auth.currentUser, { photoURL: downloadURL });
        console.log("Auth profile updated with new photo URL");
        
        // Update Firestore profile
        await updateUserProfile({ photoURL: downloadURL });
        console.log("Firestore profile updated with new photo URL");
        
        // Notify parent component
        if (onPhotoUpdated) {
          onPhotoUpdated(downloadURL);
        }
        
        Alert.alert('Success', 'Profile photo updated successfully!');
      } catch (uploadError) {
        console.error('Error during upload:', uploadError);
        Alert.alert(
          'Upload Failed', 
          'There was an error uploading your photo. Error: ' + uploadError.message,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error in upload process:', error);
      Alert.alert('Error', 'Failed to upload image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Render a simple version if we're having too many issues
  const renderSimpleVersion = () => {
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.photoContainer}
          onPress={() => Alert.alert("Photo Upload", "Photo upload functionality is currently under maintenance.")}
        >
          {photoURL ? (
            <Image 
              source={{ uri: photoURL }} 
              style={styles.profileImage} 
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <Icon name="person" size={60} color="#6366f1" />
            </View>
          )}
          <View style={styles.cameraButton}>
            <Icon name="camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // If you're having persistent issues, uncomment this to use the simple version
  // return renderSimpleVersion();

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.photoContainer}
        onPress={selectImage}
        disabled={uploading}
      >
        {photoURL ? (
          <Image 
            source={{ uri: photoURL }} 
            style={styles.profileImage} 
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Icon name="person" size={60} color="#6366f1" />
          </View>
        )}
        
        {uploading ? (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        ) : (
          <View style={styles.cameraButton}>
            <Icon name="camera" size={20} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
      <Text style={styles.helpText}>Tap to change your profile photo</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photoContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6366f1',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: 'white',
    marginTop: 8,
    fontSize: 12,
  },
  helpText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6366f1',
  }
});

export default ProfilePhotoUploader;