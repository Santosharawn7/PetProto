// src/Login.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import GoogleSignIn from './GoogleSignIn';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [message, setMessage] = useState('');

  // Redirect to Home if already logged in
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) {
      navigate('/home');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');  // clear any old message
    try {
      const response = await axios.post('http://127.0.0.1:5000/login', formData);

      if (response.data.idToken) { // Checks if the backend response includes an idToken
        localStorage.setItem('userToken', response.data.idToken); //  Stores the idToken in the browser’s local storage under the key "userToken", so you can use it later to authenticate protected routes or API requests.
        navigate('/home');
      } else {
        setMessage("Login error: No valid token returned");
      }
    } catch (error) {
      if (error.response) {
        // If your backend returns 404 for missing user:
        if (error.response.status === 404) {
          setMessage('User not found');
        } else {
          setMessage(error.response.data.error || 'Login failed');
        }
      } else {
        // Network / other errors
        setMessage('Login failed – please check your connection');
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50">
      <div className="max-w-4xl w-full max-sm:max-w-lg mx-auto p-6 mt-6 bg-white rounded shadow">
        <div className="text-center mb-12 sm:mb-16">
          <a href="javascript:void(0)">
            <img src="https://readymadeui.com/readymadeui.svg" alt="logo" className="w-44 inline-block" />
          </a>
          <h4 className="text-slate-600 text-base mt-6">Sign in to your account</h4>
        </div>

        {/* Google Sign In Section */}
        <div className="mb-8">
          <GoogleSignIn />
        </div>

        {/* Divider */}
        <div className="my-6 text-center text-sm font-medium text-slate-600">OR</div>

        {/* Traditional Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid gap-8">
            <div>
              <label className="text-slate-800 text-sm font-medium mb-2 block">
                Email or Username
              </label>
              <input
                type="text"
                name="identifier"
                placeholder="Enter email or username"
                value={formData.identifier}
                onChange={handleChange}
                className="bg-slate-100 w-full text-slate-800 text-sm px-4 py-3 rounded focus:bg-white outline-blue-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="text-slate-800 text-sm font-medium mb-2 block">
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                className="bg-slate-100 w-full text-slate-800 text-sm px-4 py-3 rounded focus:bg-white outline-blue-500 transition-all"
                required
              />
            </div>
          </div>

          <div className="mt-4 text-right">
            <a href="/password-reset" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              Forgot Password?
            </a>
          </div>

          <div className="mt-12">
            <button
              type="submit"
              className="mx-auto block py-3 px-6 text-sm font-medium tracking-wider rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              Login
            </button>
          </div>

          {message && (
            <div className="mt-4">
              <p className="text-center text-red-500 font-bold">{message}</p>
            </div>
          )}

          <div className="mt-4 text-center">
            <p className="text-slate-600 text-sm">
              Don't have an account?{' '}
              <a href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign up
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
