// FirebaseTest.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, TextInput, Alert } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Exact config from Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyAU3-0hTJnbai5gimzqaKDIYa0DWCY0jgM",
  authDomain: "vaibesync.firebaseapp.com",
  projectId: "vaibesync",
  storageBucket: "vaibesync.firebasestorage.app",
  messagingSenderId: "815049374301",
  appId: "1:815049374301:web:06257de8ebcd01a70cebb4",
  measurementId: "G-9V6YW106LE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function FirebaseTest() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  const testSignUp = async () => {
    setStatus('Testing...');
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      setStatus(`Success! User created: ${user.email}`);
      Alert.alert('Success', `User created: ${user.email}`);
    } catch (error) {
      setStatus(`Error: ${error.code} - ${error.message}`);
      Alert.alert('Error', `${error.code} - ${error.message}`);
      console.error('Firebase error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Auth Test</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <Button title="Test Sign Up" onPress={testSignUp} />
      
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
    fontSize: 16,
  },
  status: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
});