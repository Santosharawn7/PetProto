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
      // 1. Google sign-in
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const email = user.email;

      // 2. Check what sign-in methods exist for this email
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      // 3. Link Google account if necessary
      if (signInMethods.includes('password') && !signInMethods.includes('google.com')) {
        try {
          await linkWithCredential(user, credential);
        } catch (linkError) {
          console.error('Error linking accounts:', linkError);
          return;
        }
      }

      // 4. Get the Firebase ID token
      const idToken = await user.getIdToken();
      
      // 5. Backend: sign in (registers new Google users if needed)
      await axios.post(`${API_URL}/google_signin`, { idToken });

      // 6. Save token to localStorage for use in app
      localStorage.setItem('userToken', idToken);

      // 7. Fetch full user info from backend to check userType
      const userRes = await axios.get(`${API_URL}/current_user`, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      const userData = userRes.data;

      // 8. Store as userData (always flatten)
      localStorage.setItem('userData', JSON.stringify({
        ...userData,
        uid: user.uid,
        email: user.email
      }));

      // 9. Routing by userType
      if (
        !userData.firstName ||
        !userData.lastName ||
        !userData.preferredUsername ||
        !userData.phone ||
        !userData.sex ||
        !userData.address
      ) {
        // Incomplete registration: force user to complete registration
        navigate('/update_registration');
      } else if (userData.userType === 'pet_shop_owner') {
        // Pet Shop Owner
        navigate('/shop');
      } else if (userData.userType === 'pet_parent') {
        // Pet Parent
        navigate('/home');
      } else {
        // Default/fallback
        navigate('/shop');
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      alert("Google sign-in failed. Please try again.");
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
