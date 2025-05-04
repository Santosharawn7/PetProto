// src/PasswordReset.jsx
import React, { useState } from 'react';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const PasswordReset = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent. Check your inbox.');
      setError('');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setMessage('');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50">
      <div className="max-w-md w-full mx-auto p-6 mt-6 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4 text-center">Reset Password</h2>
        <form onSubmit={handleReset}>
          <div className="mb-4">
            <label className="block mb-2 text-sm text-gray-600">Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
          >
            Send Reset Email
          </button>
          {message && <p className="mt-4 text-green-600 text-center">{message}</p>}
          {error && <p className="mt-4 text-red-600 text-center">{error}</p>}
        </form>
        <div className="mt-4 text-center">
          <a href="/login" className="text-blue-600 hover:text-blue-700">Back to Login</a>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;
