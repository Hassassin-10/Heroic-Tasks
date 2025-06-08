
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
// Read from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;

// Check for essential config variables
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    "CRITICAL Firebase Config Missing: NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set in your .env.local file. " +
    "Firebase will not be initialized. Please ensure these variables are correctly set and RESTART your development server."
  );
  // app, authInstance, and dbInstance will remain undefined.
  // This will likely cause errors in components that expect Firebase to be available,
  // but it avoids the "invalid-api-key" error during the initial Firebase setup.
} else {
  // Initialize Firebase
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  if (app) {
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);
  } else {
    // This case should ideally not be reached if initializeApp succeeded or getApp returned an app.
    console.error("Firebase app object is undefined after attempting initialization. This should not happen if config is valid.");
  }
}

export { app, authInstance as auth, dbInstance as db };
