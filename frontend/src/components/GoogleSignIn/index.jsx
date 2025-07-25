import React from 'react';
import { 
  signInWithPopup, 
  fetchSignInMethodsForEmail, 
  linkWithCredential, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || 'http://127.0.0.1:5000';

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
      const credential = GoogleAuthProvider.credentialFromResult(result);

      // If email/password method exists but NOT Google, link them
      if (signInMethods.includes('password') && !signInMethods.includes('google.com')) {
        try {
          await linkWithCredential(user, credential);
        } catch (linkError) {
          console.error('Error linking accounts:', linkError);
          return; // Stop here if linking fails
        }
      }

      // Get the Firebase ID token from the user
      const idToken = await user.getIdToken();
      
      // Send token to your backend's Google sign-in endpoint
      const googleRes = await axios.post(`${API_URL}/google_signin`, { idToken });
      
      // Store the valid Firebase ID token in localStorage
      localStorage.setItem('userToken', idToken);

      // Now fetch the current user's registration info from the backend
      const userRes = await axios.get(`${API_URL}/current_user`, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      const userData = userRes.data;

      // Always save UID and other info to localStorage!
      localStorage.setItem('userInfo', JSON.stringify({
        uid: user.uid,
        email: user.email,
        userType: userData.userType || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        preferredUsername: userData.preferredUsername || '',
        phone: userData.phone || '',
        sex: userData.sex || '',
        address: userData.address || ''
      }));

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
      className="flex items-center justify-center w-full gap-3 py-4 px-4 border border-gray-300 bg-white text-black rounded-lg shadow-md hover:bg-gray-100 transition duration-300"
    >
      <img
        src="https://developers.google.com/identity/images/g-logo.png"
        alt="Google logo"
        className="w-5 h-5"
      />
      <span className="text-sm font-medium">Sign in with Google</span>
    </button>
  );
};

export default GoogleSignIn;
