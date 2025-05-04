// src/GoogleSignIn.jsx
import React from 'react';
import { auth, googleProvider } from '../../firebase';
import { signInWithPopup } from 'firebase/auth';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const GoogleSignIn = () => {
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      // Initiate Google sign in popup
      const result = await signInWithPopup(auth, googleProvider);
      // Get the Firebase ID token from the user
      const idToken = await result.user.getIdToken();
      console.log("Google sign in token:", idToken);
      
      // Send token to your backend's Google sign in endpoint (for any additional server-side verification)
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
      
      // Required registration fields from a standard registration:
      // firstName, lastName, preferredUsername, phone, sex, and address
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
      console.error("Google sign in error:", error);
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
