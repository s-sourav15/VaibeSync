// src/screens/auth/ForgotPasswordScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeScreen } from '../../components/layout/SafeScreen';
import CustomButton from '../../components/buttons/CustomButton';
import CustomInput from '../../components/inputs/CustomInput';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    // Reset error state
    setError('');
    
    // Validate email
    if (!email) {
      setError('Email is required');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
    } catch (error) {
      let errorMessage = 'Failed to send password reset email';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      }
      
      setError(errorMessage);
      console.error('Password reset error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeScreen>
      <View style={styles.container}>
        <Text style={styles.title}>Reset Password</Text>
        
        {emailSent ? (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>
              Password reset instructions have been sent to your email.
            </Text>
            <Text style={styles.instructionText}>
              Please check your inbox and follow the instructions to reset your password.
            </Text>
            <CustomButton 
              title="Back to Login"
              onPress={() => navigation.navigate('Login')}
              style={styles.button}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.instructions}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>
            
            <CustomInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              error={error}
            />

            {isLoading ? (
              <ActivityIndicator size="large" color="#6366f1" style={styles.loader} />
            ) : (
              <CustomButton 
                title="Send Reset Instructions"
                onPress={handleResetPassword}
                style={styles.button}
              />
            )}
            
            <CustomButton 
              title="Back to Login"
              onPress={() => navigation.navigate('Login')}
              style={styles.secondaryButton}
            />
          </View>
        )}
      </View>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  instructions: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#6366f1',
    marginTop: 20,
  },
  secondaryButton: {
    backgroundColor: '#818cf8',
    marginTop: 10,
  },
  loader: {
    marginTop: 20,
  },
  successContainer: {
    alignItems: 'center',
    padding: 20,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
    color: '#10b981',
  },
  instructionText: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    color: '#666',
  },
});

export default ForgotPasswordScreen;