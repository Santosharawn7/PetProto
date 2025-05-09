// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  initializeFirestore,
  enableIndexedDbPersistence,
  setLogLevel
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCOOEKSMcSF_dQkFScyJWtBePqHJwsCHF8",
  authDomain: "petdate-e0640.firebaseapp.com",
  projectId: "petdate-e0640",
  // add storageBucket, messagingSenderId, appId if you use those features
};

const app = initializeApp(firebaseConfig);

// Auth exports
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Reduce Firestore logging noise
setLogLevel('error');

// Initialize Firestore with long-polling (no HTTP2 stream)
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false
});

// Optional: enable offline persistence
enableIndexedDbPersistence(db).catch(err => {
  console.warn('Firestore persistence error', err);
});
