# Firebase Setup Instructions for Google Sign-On

This guide provides step-by-step instructions for obtaining the required Firebase configuration files for Google Sign-On authentication in the MindGarden mobile application.

## Prerequisites

- A Google account
- Access to the Google Cloud Console
- Firebase project (or ability to create one)

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select an existing project
3. Enter a project name (e.g., "mindgarden-app")
4. Choose whether to enable Google Analytics (recommended)
5. Click "Create project"

## Step 2: Enable Google Sign-In Authentication

1. In your Firebase project console, go to **Authentication** in the left sidebar
2. Click on the **Sign-in method** tab
3. Find **Google** in the list of providers and click on it
4. Click the **Enable** toggle to turn on Google Sign-In
5. Enter your **Project support email** (your email address)
6. Click **Save**

## Step 3: Configure OAuth Consent Screen (if not already done)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to **APIs & Services** > **OAuth consent screen**
4. Choose **External** user type (unless you have a Google Workspace organization)
5. Fill in the required information:
   - App name: "MindGarden"
   - User support email: Your email
   - Developer contact information: Your email
6. Add the following scopes:
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/calendar.events.readonly`
7. Add test users if needed
8. Click **Save and Continue** through all steps

## Step 4: Create OAuth 2.0 Client IDs

### For Android (google-services.json)

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click **Add app** and select **Android**
4. Enter your Android package name (e.g., `com.mindgarden.app`)
5. Enter app nickname (optional)
6. Click **Register app**
7. Download the `google-services.json` file
8. Place this file in your Android project at: `android/app/google-services.json`

### For iOS (GoogleService-Info.plist)

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click **Add app** and select **iOS**
4. Enter your iOS bundle ID (e.g., `com.mindgarden.app`)
5. Enter app nickname (optional)
6. Click **Register app**
7. Download the `GoogleService-Info.plist` file
8. Add this file to your iOS project in Xcode:
   - Drag the file into your Xcode project
   - Make sure "Copy items if needed" is checked
   - Add to your main app target

### For Web (Client ID)

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click **Add app** and select **Web**
4. Enter app nickname (e.g., "MindGarden Web")
5. Click **Register app**
6. Copy the **Web client ID** from the configuration

## Step 5: Generate Service Account Key (for Backend)

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Go to the **Service accounts** tab
3. Click **Generate new private key**
4. Click **Generate key**
5. Download the JSON file (this contains your service account credentials)
6. **Important**: Keep this file secure and never commit it to version control

## Step 6: Configure Environment Variables

### Backend Configuration

Add the following environment variables to your backend `.env` file:

```env
# Firebase Configuration (for mobile Google auth)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY_ID=your_firebase_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Firebase Private Key Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_firebase_client_email@your_project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_firebase_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your_firebase_client_email%40your_project.iam.gserviceaccount.com
```

**Note**: Replace the placeholder values with actual values from your downloaded service account JSON file.

### Mobile Configuration

Update your mobile app configuration files:

#### Android (android/app/build.gradle)

Add the Google Services plugin:

```gradle
// Add to the top of the file
apply plugin: 'com.google.gms.google-services'

// Add to dependencies
dependencies {
    implementation 'com.google.android.gms:play-services-auth:20.7.0'
}
```

#### iOS (ios/Podfile)

Add the Google Sign-In pod:

```ruby
target 'YourAppName' do
  # ... other pods
  pod 'GoogleSignIn'
end
```

## Step 7: Update Mobile Configuration

### Android Configuration

1. Open `android/app/google-services.json`
2. Copy the `client_id` value (this is your Android OAuth client ID)
3. Update your mobile app configuration in `src/services/config.ts`:

```typescript
export const configService = {
  // ... existing config
  getGoogleWebClientId: () => 'your_web_client_id_here',
  getGoogleIosClientId: () => 'your_ios_client_id_here',
  getGoogleAndroidClientId: () => 'your_android_client_id_here',
};
```

### iOS Configuration

1. Open `GoogleService-Info.plist`
2. Copy the `CLIENT_ID` value
3. Update your mobile app configuration as shown above

## Step 8: Test the Configuration

1. **Backend Test**: Run the backend tests to verify Firebase Admin SDK configuration:
   ```bash
   cd backend
   npm test -- googleAuth.mobile.test.js
   ```

2. **Mobile Test**: Build and run your mobile app to test Google Sign-In:
   ```bash
   cd mobile
   npm run android  # or npm run ios
   ```

## Troubleshooting

### Common Issues

1. **"Invalid client" error**: Ensure your OAuth client IDs are correctly configured
2. **"Project not found" error**: Verify your Firebase project ID is correct
3. **"Permission denied" error**: Check that your service account has the necessary permissions

### Security Best Practices

1. **Never commit sensitive files**: Add `google-services.json`, `GoogleService-Info.plist`, and service account JSON files to `.gitignore`
2. **Use environment variables**: Store sensitive configuration in environment variables
3. **Restrict API access**: Configure Firebase Security Rules appropriately
4. **Regular key rotation**: Rotate your service account keys periodically

### File Locations Summary

```
mindgarden/
├── mobile/
│   ├── android/app/google-services.json          # Android config
│   ├── ios/GoogleService-Info.plist              # iOS config
│   └── src/services/config.ts                    # Mobile config
├── backend/
│   ├── .env                                      # Backend environment variables
│   └── service-account-key.json                  # Service account (secure location)
└── FIREBASE_SETUP_INSTRUCTIONS.md               # This file
```

## Support

If you encounter issues during setup:

1. Check the [Firebase Documentation](https://firebase.google.com/docs)
2. Review the [Google Sign-In for React Native documentation](https://github.com/react-native-google-signin/google-signin)
3. Ensure all configuration files are properly placed and formatted
4. Verify that your OAuth consent screen is configured correctly

## Next Steps

After completing this setup:

1. Test Google Sign-In functionality in your mobile app
2. Verify account linking works correctly
3. Test calendar integration (if implemented)
4. Monitor Firebase Console for authentication events
5. Set up proper error handling and user feedback
