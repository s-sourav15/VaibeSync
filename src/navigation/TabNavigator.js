// src/navigation/TabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// Import screen components
import HomeScreen from '../screens/main/HomeScreen';
import ActivityDetailsScreen from '../screens/main/ActivityDetailsScreen';
import CreateActivityScreen from '../screens/main/CreateActivityScreen';
import MatchesScreen from '../screens/main/MatchesScreen';
import ChatScreen from '../screens/main/ChatScreen';
import ProfileNavigator from './ProfileNavigator';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const MatchesStack = createStackNavigator();
const ChatStack = createStackNavigator();

// Home Stack
const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="ActivityDetails" component={ActivityDetailsScreen} />
      <HomeStack.Screen name="CreateActivity" component={CreateActivityScreen} />
    </HomeStack.Navigator>
  );
};

// Matches Stack
const MatchesStackNavigator = () => {
  return (
    <MatchesStack.Navigator screenOptions={{ headerShown: false }}>
      <MatchesStack.Screen name="MatchesMain" component={MatchesScreen} />
      <MatchesStack.Screen name="ActivityDetails" component={ActivityDetailsScreen} />
    </MatchesStack.Navigator>
  );
};

// Chat Stack
const ChatStackNavigator = () => {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ChatMain" component={ChatScreen} />
      {/* Add chat detail screens here when implemented */}
    </ChatStack.Navigator>
  );
};

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: styles.tabBar,
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Matches" 
        component={MatchesStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    borderTopColor: '#e5e7eb',
    height: 60,
    paddingBottom: 5,
    paddingTop: 5,
  },
});