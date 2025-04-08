// // // App.js
// // import React from 'react';
// // import { NavigationContainer } from '@react-navigation/native';
// // import { createStackNavigator } from '@react-navigation/stack';
// // import { SafeAreaProvider } from 'react-native-safe-area-context';
// // import 'react-native-gesture-handler';

// // // Import screens and navigation
// // import WelcomeScreen from './src/screens/onboarding/WelcomeScreen';
// // import { AuthStack } from './src/navigation/AuthStack';
// // import { TabNavigator } from './src/navigation/TabNavigator';

// // // Import auth provider
// // import { AuthProvider, useAuth } from './src/context/AuthContext';

// // const Stack = createStackNavigator();

// // // Main navigation component that checks auth state
// // const RootNavigator = () => {
// //   const { currentUser, loading } = useAuth();
// //   const [hasSeenWelcome, setHasSeenWelcome] = React.useState(false);

// //   // Skip welcome screen after it's been seen once
// //   const handleWelcomeComplete = () => {
// //     setHasSeenWelcome(true);
// //   };

// //   if (loading) {
// //     return null; // You could add a loading spinner here
// //   }

// //   return (
// //     <NavigationContainer>
// //       <Stack.Navigator screenOptions={{ headerShown: false }}>
// //         {!hasSeenWelcome && (
// //           <Stack.Screen 
// //             name="Welcome" 
// //             component={WelcomeScreen}
// //             initialParams={{ onComplete: handleWelcomeComplete }}
// //           />
// //         )}
// //         {currentUser ? (
// //           <Stack.Screen name="MainApp" component={TabNavigator} />
// //         ) : (
// //           <Stack.Screen name="AuthStack" component={AuthStack} />
// //         )}
// //       </Stack.Navigator>
// //     </NavigationContainer>
// //   );
// // };

// // // Root component that provides auth context
// // export default function App() {
// //   return (
// //     <SafeAreaProvider>
// //       <AuthProvider>
// //         <RootNavigator />
// //       </AuthProvider>
// //     </SafeAreaProvider>
// //   );
// // }

// // App.js
// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createStackNavigator } from '@react-navigation/stack';
// import { SafeAreaProvider } from 'react-native-safe-area-context';
// import 'react-native-gesture-handler';

// // Import screens and navigation
// import WelcomeScreen from './src/screens/onboarding/WelcomeScreen';
// import { AuthStack } from './src/navigation/AuthStack';
// import { TabNavigator } from './src/navigation/TabNavigator';

// // Import auth provider
// import { AuthProvider, useAuth } from './src/context/AuthContext';

// const Stack = createStackNavigator();

// // Main navigation component that checks auth state
// const RootNavigator = () => {
//   const { currentUser, loading } = useAuth();
//   const [hasSeenWelcome, setHasSeenWelcome] = React.useState(false);

//   // Check if welcome screen has been seen before
//   React.useEffect(() => {
//     // In a real app, you'd use AsyncStorage to persist this value
//     // Example: AsyncStorage.getItem('hasSeenWelcome').then(value => setHasSeenWelcome(!!value))
//   }, []);

//   // Skip welcome screen after it's been seen once
//   const handleWelcomeComplete = () => {
//     setHasSeenWelcome(true);
//     // In a real app: AsyncStorage.setItem('hasSeenWelcome', 'true')
//   };

//   if (loading) {
//     // You could add a loading spinner here
//     return null;
//   }

//   return (
//     <NavigationContainer>
//       <Stack.Navigator screenOptions={{ headerShown: false }}>
//         {!hasSeenWelcome && (
//           <Stack.Screen 
//             name="Welcome" 
//             component={WelcomeScreen}
//             initialParams={{ onComplete: handleWelcomeComplete }}
//           />
//         )}
//         {currentUser ? (
//           <Stack.Screen name="MainApp" component={TabNavigator} />
//         ) : (
//           <Stack.Screen name="AuthStack" component={AuthStack} />
//         )}
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// // Root component that provides auth context
// export default function App() {
//   return (
//     <SafeAreaProvider>
//       <AuthProvider>
//         <RootNavigator />
//       </AuthProvider>
//     </SafeAreaProvider>
//   );
// }
// App.js
// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-gesture-handler';

// Import screens and navigation
import WelcomeScreen from './src/screens/onboarding/WelcomeScreen';
import { AuthStack } from './src/navigation/AuthStack';
import { TabNavigator } from './src/navigation/TabNavigator';

// Import providers
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ActivityProvider } from './src/context/ActivityContext';
import { RecommendationProvider } from './src/context/RecommendationContext';

const Stack = createStackNavigator();

// Main navigation component that checks auth state
const RootNavigator = () => {
  const { currentUser, loading } = useAuth();
  const [hasSeenWelcome, setHasSeenWelcome] = React.useState(false);

  // Check if welcome screen has been seen before
  React.useEffect(() => {
    // In a real app, you'd use AsyncStorage to persist this value
    // Example: AsyncStorage.getItem('hasSeenWelcome').then(value => setHasSeenWelcome(!!value))
  }, []);

  // Skip welcome screen after it's been seen once
  const handleWelcomeComplete = () => {
    setHasSeenWelcome(true);
    // In a real app: AsyncStorage.setItem('hasSeenWelcome', 'true')
  };

  if (loading) {
    // You could add a loading spinner here
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasSeenWelcome && (
          <Stack.Screen 
            name="Welcome" 
            component={WelcomeScreen}
            initialParams={{ onComplete: handleWelcomeComplete }}
          />
        )}
        {currentUser ? (
          <Stack.Screen name="MainApp" component={TabNavigator} />
        ) : (
          <Stack.Screen name="AuthStack" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Root component that provides auth context
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ActivityProvider>
          <RecommendationProvider>
            <RootNavigator />
          </RecommendationProvider>
        </ActivityProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}