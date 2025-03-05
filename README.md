# Vaibe.Sync

A React Native mobile application that helps users find and connect with others who share similar activity interests with the goal find your partner and not just date.


## Features

- **User Authentication**: Secure login, signup, and password recovery
- **Activity Matching**: Find users with similar activity interests
- **Real-time Chat**: Connect and chat with matched users
- **User Profiles**: Customize profiles with interests and personal information
- **Offline Support**: Basic functionality when offline

## Project Structure

```
/
├── src/
│   ├── components/     # Reusable UI components
│   ├── config/         # Configuration files
│   ├── context/        # React Context providers
│   ├── navigation/     # Navigation configuration
│   ├── screens/        # App screens
│   │   ├── auth/       # Authentication screens
│   │   ├── main/       # Main app screens
│   │   └── onboarding/ # Onboarding screens
│   ├── services/       # API and Firebase services
│   ├── styles/         # Shared styles
│   └── utils/          # Utility functions
└── App.js              # Entry point
```

## Tech Stack

- **React Native**: Cross-platform mobile framework
- **Expo**: Development platform and toolchain
- **Firebase**: Authentication and database
- **React Navigation**: Screen navigation
- **Firestore**: Cloud database for user data
- **React Native Vector Icons**: UI icons

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI
- Expo Go app on your iOS or Android device for testing

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/activity-match.git
   cd activity-match
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up Firebase:
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com)
   - Enable Authentication with Email/Password
   - Create a Firestore database
   - Add your Firebase configuration to `src/config/firebase.js`

4. Run the app with Expo:
   ```bash
   npx expo start
   ```
   
5. Open the app:
   - Scan the QR code with the Expo Go app on your device
   - Press 'i' for iOS simulator or 'a' for Android emulator (if configured)
   - Press 'w' to open in web browser

## Development

### Environment Setup

For Expo projects, create an `app.config.js` file to manage environment variables:

```javascript
export default {
  expo: {
    name: "ActivityMatch",
    slug: "activity-match",
    // ... other expo config
    extra: {
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
    },
  },
};
```

Then create a `.env` file in the project root with:
```
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
```

### Firebase Configuration

Replace the placeholder values in `src/config/firebase.js` with your own Firebase project configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Authentication Flow

1. Users start at the Welcome screen
2. They can sign up with email and password
3. After authentication, they're directed to the main app
4. User sessions persist until they log out

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request



## Acknowledgements

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [Firebase](https://firebase.google.com/)
- [React Navigation](https://reactnavigation.org/)
