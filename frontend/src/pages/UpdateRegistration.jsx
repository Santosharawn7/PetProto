import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || 'http://127.0.0.1:5000';

const userTypeOptions = [
  { value: 'pet_parent', display: 'Pet Parent' },
  { value: 'pet_shop_owner', display: 'Pet Shop Owner' },
  { value: 'veterinarian', display: 'Veterinarian' },
  { value: 'pet_sitter', display: 'Pet Sitter' }
];

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
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
      return;
    }
    setLoading(true);
    axios.get(`${API_URL}/current_user`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res.data.profileCompleted) {
          // User already complete, skip this page
          if (res.data.userType === "pet_shop_owner") {
            window.location.replace('http://localhost:5173/shop');
          } else if (res.data.userType === "pet_parent") {
            navigate('/home');
          } else {
            navigate('/shop');
          }
        } else {
          // Pre-fill form with data from backend
          setRegInfo({
            firstName: res.data.firstName || "",
            lastName: res.data.lastName || "",
            preferredUsername: res.data.preferredUsername || "",
            phone: res.data.phone || "",
            sex: res.data.sex || "",
            address: res.data.address || "",
            userType: res.data.userType || ""
          });
        }
        setLoading(false);
      })
      .catch(err => {
        // If 404, treat as "new user" (let form be blank)
        if (err.response && err.response.status === 404) {
          setCreating(true);  // show message if desired
        } else if (err.response && err.response.status === 401) {
          // Token expired or invalid, force login
          navigate('/login');
        } else {
          setMessage('Error loading user info. Try again or contact support.');
        }
        setLoading(false);
      });
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRegInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    const token = localStorage.getItem('userToken');
    if (!token) { setMessage("Please log in again."); setLoading(false); return; }

    // Try to get UID from localStorage
    let uid = '';
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      uid = userData.uid || userData.localId;
    } catch {}
    // Not fatal if no UID; backend should fallback to token

    try {
      const payload = { ...regInfo };
      if (uid) payload.uid = uid;
      const resp = await axios.post(`${API_URL}/update-registration`, payload, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (resp.data.success && resp.data.user) {
        localStorage.setItem('userData', JSON.stringify({ ...resp.data.user, uid: uid || resp.data.user.uid }));
        setMessage('Registration updated! Redirecting...');
        setTimeout(() => {
          if (regInfo.userType === "pet_shop_owner") {
            window.location.replace('http://localhost:5173/shop');
          } else if (regInfo.userType === "pet_parent") {
            navigate('/home');
          } else {
            navigate('/shop');
          }
        }, 1000);
      } else {
        setMessage(resp.data.error || 'Registration update failed.');
      }
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to update. Try again.');
    }
    setLoading(false);
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 py-8">
      <div className="max-w-xl w-full mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-center text-3xl font-bold mb-6 text-gray-800">
          {creating ? "Create Your Account" : "Complete Your Registration"}
        </h2>
        {creating && (
          <p className="text-center mb-6 text-gray-600">
            Welcome! Please complete your profile to get started.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="firstName" value={regInfo.firstName} onChange={handleChange} placeholder="First Name" required className="border p-2 rounded" />
            <input name="lastName" value={regInfo.lastName} onChange={handleChange} placeholder="Last Name" required className="border p-2 rounded" />
          </div>
          <input name="preferredUsername" value={regInfo.preferredUsername} onChange={handleChange} placeholder="Preferred Username" required className="border p-2 rounded w-full" />
          <input name="phone" value={regInfo.phone} onChange={handleChange} placeholder="Phone" required className="border p-2 rounded w-full" />
          <select name="userType" value={regInfo.userType} onChange={handleChange} required className="border p-2 rounded w-full">
            <option value="">Select user type</option>
            {userTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.display}</option>)}
          </select>
          <select name="sex" value={regInfo.sex} onChange={handleChange} required className="border p-2 rounded w-full">
            <option value="">Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
          <input name="address" value={regInfo.address} onChange={handleChange} placeholder="Address" required className="border p-2 rounded w-full" />
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-3 rounded font-bold w-full">
            {loading ? "Updating..." : creating ? "Create Account" : "Update Registration"}
          </button>
          {message && <div className="mt-4 text-center text-red-600">{message}</div>}
        </form>
      </div>
    </div>
  );
};

export default UpdateRegistration;
