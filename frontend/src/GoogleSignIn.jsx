// src/GoogleSignIn.jsx
import React from 'react';
import { auth, googleProvider } from './firebase';
import { 
  signInWithPopup, 
  fetchSignInMethodsForEmail, 
  linkWithCredential, 
  GoogleAuthProvider 
} from 'firebase/auth';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const GoogleSignIn = () => {
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      // Initiate Google sign-in popup
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const email = user.email;

      // Check what sign-in methods exist for this email
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      console.log("Existing sign-in methods for this email:", signInMethods);

      const credential = GoogleAuthProvider.credentialFromResult(result);

      // If email/password method exists but NOT Google, link them
      if (signInMethods.includes('password') && !signInMethods.includes('google.com')) {
        try {
          await linkWithCredential(user, credential);
          console.log('Google account linked to existing Email/Password user.');
        } catch (linkError) {
          console.error('Error linking accounts:', linkError);
          return; // Stop here if linking fails
        }
      }

      // Get the Firebase ID token from the user
      const idToken = await user.getIdToken();
      console.log("Google sign-in token:", idToken);
      
      // Send token to your backend's Google sign-in endpoint
      const googleRes = await axios.post('http://127.0.0.1:5000/google_signin', { idToken });
      console.log("Backend google_signin response:", googleRes.data);
      
      // Store the valid Firebase ID token in localStorage
      localStorage.setItem('userToken', idToken);

      // Now fetch the current user's registration info from the backend
      const userRes = await axios.get('http://127.0.0.1:5000/current_user', {
          headers: { Authorization: `Bearer ${idToken}` }
      });
      console.log("Current user data:", userRes.data);
      const userData = userRes.data;
      
      // Required registration fields
      if (
        !userData.firstName ||
        !userData.lastName ||
        !userData.preferredUsername ||
        !userData.phone ||
        !userData.sex ||
        !userData.address
      ) {
        // Registration info incomplete: redirect to update registration page
        navigate('/update_registration');
      } else {
        // Registration info is complete: proceed to Home page
        navigate('/home');
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className="py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none w-full"
    >
      Sign in with Google
    </button>
  );
};

export default GoogleSignIn;
