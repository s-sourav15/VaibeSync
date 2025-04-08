// // src/utils/network.js
// import { useEffect, useState } from 'react';
// import { Alert } from 'react-native';
// import NetInfo from '@react-native-community/netinfo';

// /**
//  * Custom hook to track network status
//  * @returns {Object} Network status information
//  */
// export const useNetworkStatus = () => {
//   const [isConnected, setIsConnected] = useState(true);
//   const [connectionType, setConnectionType] = useState(null);
  
//   useEffect(() => {
//     // Subscribe to network status updates
//     const unsubscribe = NetInfo.addEventListener(state => {
//       setIsConnected(state.isConnected);
//       setConnectionType(state.type);
      
//       // Alert user when connection is lost or restored (optional)
//       if (state.isConnected === false) {
//         Alert.alert(
//           'No Internet Connection',
//           'You are currently offline. Some features may be limited.',
//           [{ text: 'OK' }]
//         );
//       }
//     });
    
//     // Initial check
//     NetInfo.fetch().then(state => {
//       setIsConnected(state.isConnected);
//       setConnectionType(state.type);
//     });
    
//     // Cleanup subscription
//     return () => unsubscribe();
//   }, []);
  
//   return {
//     isConnected,
//     connectionType,
//   };
// };

// /**
//  * Checks if device is currently online
//  * @returns {Promise<boolean>} Whether device is online
//  */
// export const checkOnlineStatus = async () => {
//   try {
//     const state = await NetInfo.fetch();
//     return state.isConnected && state.isInternetReachable;
//   } catch (error) {
//     console.error('Error checking online status:', error);
//     return false;
//   }
// };

// /**
//  * Shows a network error alert if offline
//  * @returns {Promise<boolean>} Whether device is online
//  */
// export const showNetworkErrorIfOffline = async () => {
//   const isOnline = await checkOnlineStatus();
  
//   if (!isOnline) {
//     Alert.alert(
//       'No Internet Connection',
//       'This action requires an internet connection. Please check your network and try again.',
//       [{ text: 'OK' }]
//     );
//   }
  
//   return isOnline;
// };
// src/utils/network.js
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

/**
 * Custom hook to track network status
 * @returns {Object} Network status information
 */
export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionType, setConnectionType] = useState(null);
  
  useEffect(() => {
    // Subscribe to network status updates
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      setConnectionType(state.type);
      
      // Alert user when connection is lost (optional - comment this out if you don't want alerts)
      if (state.isConnected === false) {
        Alert.alert(
          'No Internet Connection',
          'You are currently offline. Some features may be limited.',
          [{ text: 'OK' }]
        );
      }
    });
    
    // Initial check
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected);
      setConnectionType(state.type);
    });
    
    // Cleanup subscription
    return () => unsubscribe();
  }, []);
  
  return {
    isConnected,
    connectionType,
  };
};

/**
 * Checks if device is currently online
 * @returns {Promise<boolean>} Whether device is online
 */
export const checkOnlineStatus = async () => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
  } catch (error) {
    console.error('Error checking online status:', error);
    return false;
  }
};

/**
 * Shows a network error alert if offline
 * @returns {Promise<boolean>} Whether device is online
 */
export const showNetworkErrorIfOffline = async () => {
  const isOnline = await checkOnlineStatus();
  
  if (!isOnline) {
    Alert.alert(
      'No Internet Connection',
      'This action requires an internet connection. Please check your network and try again.',
      [{ text: 'OK' }]
    );
  }
  
  return isOnline;
};