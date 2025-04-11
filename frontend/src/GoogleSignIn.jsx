// src/GoogleSignIn.jsx
import React from 'react';
import { auth, googleProvider } from './firebase'; // Make sure firebase is set up as described below
import { signInWithPopup } from 'firebase/auth';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const GoogleSignIn = () => {
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      // Launch Google sign-in popup
      const result = await signInWithPopup(auth, googleProvider);
      // Get the Firebase ID token from the signed-in user
      const idToken = await result.user.getIdToken();

      // Send the ID token to your backend for verification
      const response = await axios.post('http://127.0.0.1:5000/google_signin', { idToken });
      console.log("Google sign in response:", response.data);
      // Navigate to home (or welcome page) after successful sign in
      navigate('/home');
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
