// src/UpdateRegistration.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const UpdateRegistration = () => {
  const navigate = useNavigate();
  const [regInfo, setRegInfo] = useState({
    firstName: '',
    lastName: '',
    preferredUsername: '',
    phone: '',
    sex: '',
    address: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check for session token; if missing, redirect to login.
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRegInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('userToken');
    if (!token) {
      setMessage("Not authenticated.");
      return;
    }
    try {
      const response = await axios.post(
        'http://127.0.0.1:5000/update_registration',
        regInfo,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(response.data.message);
      // After successful update, redirect to home
      navigate('/home');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Registration update failed');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50">
      <div className="max-w-xl w-full mx-auto p-6 bg-white rounded shadow">
        <h2 className="text-center text-3xl font-bold mb-6">Complete Your Registration</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              name="firstName"
              placeholder="Enter your first name"
              value={regInfo.firstName}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              name="lastName"
              placeholder="Enter your last name"
              value={regInfo.lastName}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Preferred Username</label>
            <input
              type="text"
              name="preferredUsername"
              placeholder="Enter your preferred username"
              value={regInfo.preferredUsername}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="text"
              name="phone"
              placeholder="Enter your phone number"
              value={regInfo.phone}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Sex</label>
            <select
              name="sex"
              value={regInfo.sex}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            >
              <option value="">Select sex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <input
              type="text"
              name="address"
              placeholder="Enter your address"
              value={regInfo.address}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full py-3 px-6 text-lg font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none"
            >
              Update Registration
            </button>
          </div>
          {message && (
            <div className="mt-4">
              <p className="text-center text-red-500 font-bold">{message}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default UpdateRegistration;
