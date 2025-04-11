// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCOOEKSMcSF_dQkFScyJWtBePqHJwsCHF8",  // your Web API Key
  authDomain: "petdate-e0640.firebaseapp.com",           // update with your authDomain
  projectId: "petdate-e0640",                              // your project id
  // Include other keys as needed (e.g., storageBucket, messagingSenderId, appId)
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
