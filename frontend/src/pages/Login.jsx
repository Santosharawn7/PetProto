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

  // Redirect to /shop or redirect param if already logged in
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) {
      const userData = localStorage.getItem('userData');
      if (userData) {
        redirectToShop(JSON.parse(userData).userType);
      } else {
        navigate('/shop');
      }
    }
    // eslint-disable-next-line
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const API_URL =
    import.meta.env.VITE_API_URL ||
    process.env.VITE_API_URL ||
    'http://127.0.0.1:5000';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/login`, formData);

      if (response.data.idToken) {
        // Store authentication token
        localStorage.setItem('userToken', response.data.idToken);

        // Store user data including userType
        const userData = {
          email: response.data.email,
          userType: response.data.userType, // e.g., "pet-shop-owner", "pet_parent", etc.
          localId: response.data.localId,
          expiresIn: response.data.expiresIn,
        };
        localStorage.setItem('userData', JSON.stringify(userData));

        // Update auth state
        setIsLoggedIn(true);

        // Redirect after login (userType-aware)
        redirectToShop(response.data.userType);

      } else {
        setMessage("Login error: No valid token returned");
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          setMessage('User not found');
        } else if (error.response.status === 403) {
          setMessage('Please verify your email before logging in');
        } else {
          setMessage(error.response.data.error || 'Login failed');
        }
      } else {
        setMessage('Login failed – please check your connection');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="py-24 md:py-32"
      style={{
        backgroundImage: "url('flex-ui-assets/elements/pattern-white.svg')",
        backgroundPosition: 'center',
      }}
    >
      <div className="container px-4 mx-auto">
        <div className="max-w-sm mx-auto">
          <div className="mb-8 text-center">
            <a className="inline-block" href="#">
              <img
                className="h-50 w-50"
                src={LogoOmniverse}
                alt="Logo"
              />
            </a>
            <p className="text-lg text-coolGray-500 font-medium">
              Sign in to your account
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block mb-2 text-coolGray-800 font-medium">Email or Username*</label>
              <input
                type="text"
                name="identifier"
                placeholder="Enter email or username"
                value={formData.identifier}
                onChange={handleChange}
                className="appearance-none block w-full p-3 leading-5 text-coolGray-900 border border-coolGray-200 rounded-lg shadow-md placeholder-coolGray-400 focus:outline-none focus:ring-3 bg-white"
                required
                disabled={loading}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 text-coolGray-800 font-medium">Password*</label>
              <input
                type="password"
                name="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                className="appearance-none block w-full p-3 leading-5 text-coolGray-900 border border-coolGray-200 rounded-lg shadow-md placeholder-coolGray-400 focus:outline-none focus:ring-3 bg-white"
                required
                disabled={loading}
              />
            </div>
            <div className="my-4 text-right">
              <a href="/password-reset" className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-sm">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-block py-3 px-7 mb-4 w-full text-base text-green-50 font-medium text-center leading-6 bg-blue-600 hover:bg-blue-800 focus:ring-3 focus:ring-green-500 focus:ring-opacity-50 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
            <div className="mb-6">
              <GoogleSignIn />
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
              <div className="mt-4">
                <p className={`text-center font-bold ${message.includes('verify') ? 'text-yellow-600' : 'text-red-500'}`}>
                  {message}
                </p>
              </div>
            )}

          </form>
        </div>
      </div>
    </section>
  );
};

export default Login;
