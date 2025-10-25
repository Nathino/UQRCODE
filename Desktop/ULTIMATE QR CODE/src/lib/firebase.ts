import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Validate that all required environment variables are present
const requiredEnvVars = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
  VITE_FIREBASE_MEASUREMENT_ID: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required Firebase environment variables: ${missingVars.join(', ')}\n` +
    'Please create a .env file with all required Firebase configuration variables.'
  );
}

const firebaseConfig = {
  apiKey: requiredEnvVars.VITE_FIREBASE_API_KEY,
  authDomain: requiredEnvVars.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: requiredEnvVars.VITE_FIREBASE_PROJECT_ID,
  storageBucket: requiredEnvVars.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: requiredEnvVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: requiredEnvVars.VITE_FIREBASE_APP_ID,
  measurementId: requiredEnvVars.VITE_FIREBASE_MEASUREMENT_ID
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);