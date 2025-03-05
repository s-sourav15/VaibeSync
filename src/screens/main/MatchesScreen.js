// src/screens/main/MatchesScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeScreen } from '../../components/layout/SafeScreen';

const MatchesScreen = () => {
  return (
    <SafeScreen>
      <View style={styles.container}>
        <Text style={styles.title}>Matches Screen</Text>
        <Text style={styles.subtitle}>Your Activity Matches</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
});

export default MatchesScreen;