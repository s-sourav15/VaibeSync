// src/components/layout/SafeScreen.js
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

export const SafeScreen = ({ children, style }) => {
  return (
    <SafeAreaView style={[styles.screen, style]}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
});