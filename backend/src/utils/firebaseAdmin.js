import admin from 'firebase-admin';
import logger from './logger.js';

let firebaseApp = null;

export function initializeFirebaseAdmin() {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Check if Firebase is already initialized
    if (admin.apps && admin.apps.length > 0) {
      firebaseApp = admin.apps[0];
      logger.info('Firebase Admin SDK already initialized');
      return firebaseApp;
    }

    // Initialize Firebase Admin SDK with service account
    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    };

    // Validate required environment variables
    const requiredFields = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_CLIENT_ID',
    ];

    const missingFields = requiredFields.filter(field => !process.env[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required Firebase environment variables: ${missingFields.join(', ')}`);
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    logger.info('Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

export function getFirebaseAuth() {
  if (!firebaseApp) {
    initializeFirebaseAdmin();
  }
  return admin.auth();
}

export async function verifyGoogleIdToken(idToken) {
  try {
    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    if (!decodedToken.email) {
      throw new Error('Email not found in Google ID token');
    }
    if (!decodedToken.email_verified) {
      throw new Error('Email must be verified');
    }
    return decodedToken;
  } catch (error) {
    logger.error('Error verifying Google ID token:', error);
    throw error;
  }
}
