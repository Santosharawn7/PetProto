import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getFullAddressSuggestions } from '../services/locationService';

const UpdateRegistration = () => {
  const navigate = useNavigate();
  const [regInfo, setRegInfo] = useState({
    firstName: '', 
    lastName: '', 
    preferredUsername: '', 
    phone: '', 
    sex: '', 
    address: '',
    userType: ''
  });
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [userTypeOptions, setUserTypeOptions] = useState([]);
  const [message, setMessage] = useState('');
  const [userTypesLoading, setUserTypesLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) navigate('/login');

    // Fetch user types from backend (more maintainable)
    fetchUserTypes();
    // Pre-fill form from userInfo if available
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    setRegInfo((prev) => ({
      ...prev,
      ...userInfo, // this will pre-fill any matching fields, including uid if present
    }));
  }, [navigate]);

  const fetchUserTypes = async () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
    try {
      setUserTypesLoading(true);
      const response = await axios.get(`${API_URL}/user-types`);
      // Convert to desired format for the select
      if (Array.isArray(response.data)) {
        setUserTypeOptions(
          response.data.map(type => ({
            value: type.replace(/ /g, '_').toLowerCase(), // e.g. 'Pet Parent' => 'pet_parent'
            label: type
          }))
        );
      } else {
        setUserTypeOptions([]);
      }
    } catch {
      // fallback (same as Registration.jsx)
      setUserTypeOptions([
        { value: 'pet_parent', label: 'Pet Parent' },
        { value: 'pet_shop_owner', label: 'Pet Shop Owner' },
        { value: 'veterinarian', label: 'Veterinarian' },
        { value: 'pet_sitter', label: 'Pet Sitter' }
      ]);
    } finally {
      setUserTypesLoading(false);
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setRegInfo((prev) => ({ ...prev, [name]: value }));

    if (name === 'address' && value.length > 3) {
      const suggestions = await getFullAddressSuggestions(value);
      setAddressSuggestions(suggestions);
    }
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('userToken');
    if (!token) return setMessage("Not authenticated.");

    try {
      // Always get uid from localStorage
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const uid = userInfo.uid;
      if (!uid) {
        setMessage('Missing user UID');
        return;
      }

      // Prepare update payload
      const payload = { ...regInfo, uid };

      // For userType, map select value (e.g. 'pet_shop_owner') back to label (e.g. 'Pet Shop Owner')
      const typeObj = userTypeOptions.find(t => t.value === regInfo.userType);
      if (typeObj) payload.userType = typeObj.label;

      const response = await axios.post(
        `${API_URL}/update-registration`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update localStorage if needed
      const updatedUserInfo = { ...userInfo, ...regInfo, uid };
      updatedUserInfo.userType = typeObj ? typeObj.label : regInfo.userType;
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));

      setMessage(response.data.message);
      setTimeout(() => navigate('/home'), 1500);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Registration update failed');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="max-w-xl w-full mx-auto p-6 bg-white rounded shadow">
        <h2 className="text-center text-3xl font-bold mb-6">Complete Your Registration</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {['firstName', 'lastName', 'preferredUsername', 'phone'].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700">
                {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </label>
              <input
                type="text"
                name={field}
                value={regInfo[field]}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700">User Type</label>
            <select
              name="userType"
              value={regInfo.userType}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
              disabled={userTypesLoading}
            >
              <option value="">
                {userTypesLoading ? 'Loading user types...' : 'Select your role'}
              </option>
              {userTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {userTypesLoading && (
              <p className="mt-1 text-sm text-coolGray-600">Loading user types...</p>
            )}
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
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <input
              list="address-options"
              name="address"
              value={regInfo.address}
              onChange={handleChange}
              placeholder="Start typing your full address..."
              required
              className="mt-1 block w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <datalist id="address-options">
              {addressSuggestions.map((addr, i) => (
                <option key={i} value={addr} />
              ))}
            </datalist>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-6 text-lg font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Update Registration
          </button>
          {message && <p className="mt-4 text-center text-red-500 font-bold">{message}</p>}
        </form>
      </div>
    </div>
  );
};

export default UpdateRegistration;
