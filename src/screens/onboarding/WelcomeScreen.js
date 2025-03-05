// src/screens/onboarding/WelcomeScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeScreen } from '../../components/layout/SafeScreen';

const WelcomeScreen = ({ navigation, route }) => {
  const handleGetStarted = () => {
    // Mark welcome screen as seen
    if (route.params?.onComplete) {
      route.params.onComplete();
    }
    
    // Navigate to auth stack
    navigation.replace('AuthStack');
  };

  return (
    <SafeScreen>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to Vaibe.Sync</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={handleGetStarted}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default WelcomeScreen;