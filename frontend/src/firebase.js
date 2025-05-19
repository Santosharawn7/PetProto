// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getFirestore,
  enableIndexedDbPersistence,
  setLogLevel
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCOOEKSMcSF_dQkFScyJWtBePqHJwsCHF8",
  authDomain: "petdate-e0640.firebaseapp.com",
  projectId: "petdate-e0640",
  // Optionally: storageBucket, messagingSenderId, appId
};

const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firestore (default: with HTTP/2 streams, or force long-polling if you need)
// You may use getFirestore(app) for most cases
export const db = getFirestore(app);

// Optional: reduce Firestore logging noise
setLogLevel && setLogLevel('error');

// Optional: enable offline persistence (works on most modern browsers)
enableIndexedDbPersistence(db).catch(err => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open at once
    console.warn('Persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    // Browser does not support all features
    console.warn('This browser does not support all persistence features.');
  } else {
    console.warn('Firestore persistence error', err);
  }
});
