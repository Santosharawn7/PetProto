// src/Login.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import GoogleSignIn from '../components/GoogleSignIn';
import LogoOmniverse from '../assets/LogoOmniverse.png';

// Helper to read ?redirect= param
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Helper function to flatten user data (from original)
function flattenUser(user) {
  if (user && typeof user === "object" && user.user && typeof user.user === "object") {
    user = { ...user.user, ...user };
    delete user.user;
  }
  return user;
}

// Your Pet Shop URLs (update as needed)
const PET_SHOP_URL_LOCAL = "http://localhost:5002/shop";
const PET_SHOP_URL_LAN = "http://192.168.2.17:5002/shop"; // Update to your network IP as needed

const Login = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL =
    import.meta.env.VITE_API_URL ||
    process.env.VITE_API_URL ||
    'http://127.0.0.1:5000';

  // Enhanced redirect logic that checks localStorage on mount (from original)
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        try {
          let userData = JSON.parse(userDataStr);
          userData = flattenUser(userData);
          if (userData.userType === 'pet_shop_owner') navigate('/shop', { replace: true });
          else if (userData.userType === 'pet_parent') navigate('/home', { replace: true });
          else navigate('/shop', { replace: true });
        } catch {
          // If parsing fails, use the new redirect logic
          redirectToShop(JSON.parse(userDataStr).userType);
        }
      } else {
        navigate('/shop');
      }
    }
    // eslint-disable-next-line
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Main redirect logic:
  // - If user is "pet-shop-owner" (code, not display name), send to Pet Shop app.
  // - For all others, use redirect param or go to local /shop.
  const redirectToShop = (userType) => {
    const redirectUrl = getQueryParam('redirect');

    // Always use ?redirect param if present
    if (redirectUrl) {
      window.location.replace(redirectUrl);
      return;
    }

    // If Pet Shop Owner, send to pet shop app (choose LAN or localhost as needed)
    if (userType === "pet-shop-owner") {
      // Prefer localhost, fallback to LAN (or swap as you wish)
      window.location.replace(PET_SHOP_URL_LOCAL);
      // Or, if accessing from another device, use the LAN IP instead:
      // window.location.replace(PET_SHOP_URL_LAN);
      return;
    }

    // All other users go to Omniverse's /shop
    navigate('/shop');
  };

  // Enhanced login function that combines both approaches
  const doLogin = async (payload) => {
    setLoading(true);
    setMessage('');
    try {
      const response = await axios.post(`${API_URL}/login`, payload);
      if (response.data && response.data.idToken) {
        const flatUser = flattenUser(response.data);
        localStorage.setItem('userToken', flatUser.idToken || flatUser.id_token);
        localStorage.setItem('userData', JSON.stringify(flatUser));
        if (setIsLoggedIn) setIsLoggedIn(true);

        // Check for profile completion (from original)
        if (!flatUser.profileCompleted) {
          setMessage('Please complete your registration.');
          setTimeout(() => navigate('/update-registration'), 1000);
        } else {
          // Use the new redirect logic
          redirectToShop(flatUser.userType);
        }
      } else {
        setMessage(response.data.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      // Enhanced error handling from original
      setMessage(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Login failed. Please try again.'
      );
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.identifier || !formData.password) {
      setMessage('Please fill in both fields.');
      return;
    }
    doLogin({ identifier: formData.identifier, password: formData.password });
  };

  // Google sign-in handler (from original)
  const handleGoogleLogin = (googleIdToken) => {
    doLogin({ idToken: googleIdToken });
  };

  return (
    <section className="py-24 md:py-32">
      <div className="container px-4 mx-auto">
        <div className="max-w-sm mx-auto">
          <div className="mb-8 text-center">
            <a className="inline-block" href="#">
              <img className="h-50 w-50" src={LogoOmniverse} alt="Logo" />
            </a>
            <p className="text-lg text-coolGray-500 font-medium">Sign in to your account</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block mb-2 text-coolGray-800 font-medium">Email or Username *</label>
              <input
                type="text"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Enter your email or username"
                className="block w-full p-3 border rounded-lg"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 text-coolGray-800 font-medium">Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Enter your password"
                className="block w-full p-3 border rounded-lg"
              />
            </div>
            <div className="my-4 text-right">
              <a href="/password-reset" className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-sm">
                Forgot Password?
              </a>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <div className="my-6">
              <GoogleSignIn onGoogleSuccess={handleGoogleLogin} disabled={loading} />
            </div>
            <p className="text-center">
              <span className="text-sm font-medium">Don't have an account?</span>{' '}
              <a
                className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                href="/register"
              >
                Sign Up
              </a>
            </p>
            {message && (
              <div className={`mt-4 text-center font-bold ${message.includes('success') || message.includes('complete') ? 'text-green-600' : message.includes('verify') ? 'text-yellow-600' : 'text-red-500'}`}>
                {message}
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};

export default Login;