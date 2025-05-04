import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getFullAddressSuggestions } from '../services/locationService';

const UpdateRegistration = () => {
  const navigate = useNavigate();
  const [regInfo, setRegInfo] = useState({
    firstName: '', lastName: '', preferredUsername: '', phone: '', sex: '', address: ''
  });
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) navigate('/login');
  }, [navigate]);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setRegInfo((prev) => ({ ...prev, [name]: value }));

    if (name === 'address' && value.length > 3) {
      const suggestions = await getFullAddressSuggestions(value);
      setAddressSuggestions(suggestions);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('userToken');
    if (!token) return setMessage("Not authenticated.");

    try {
      const response = await axios.post(
        'http://127.0.0.1:5000/update_registration',
        regInfo,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(response.data.message);
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