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
    <div className="flex justify-center items-center min-h-screen mt-12 md:-mt-60">
      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl p-8 borderborder-white/20">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-800 text-nowrap mt-2 mb-8">
          {creating ? "Create Your Account" : "Complete Your Registration"}
        </h2>
        {creating && (
          <p className="text-center mb-6 text-gray-500">
            Welcome! Please complete your profile to get started.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-lg text-gray-800 mb-1">First Name</label>
              <input name="firstName" value={regInfo.firstName} onChange={handleChange} placeholder="First Name" required className="w-full border border-purple-200 rounded-xl px-4 py-3" />
            </div>
            <div>
              <label className="block font-bold text-lg text-gray-800 mb-1">Last Name</label>
              <input name="lastName" value={regInfo.lastName} onChange={handleChange} placeholder="Last Name" required className="w-full border border-purple-200 rounded-xl px-4 py-3" />
            </div>
          </div>
  
          <div>
            <label className="block font-bold text-lg text-gray-800 mb-1">Preferred Username</label>
            <input name="preferredUsername" value={regInfo.preferredUsername} onChange={handleChange} placeholder="Username" required className="w-full border border-purple-200 rounded-xl px-4 py-3" />
          </div>
  
          <div>
            <label className="block font-bold text-lg text-gray-800 mb-1">Phone</label>
            <input name="phone" value={regInfo.phone} onChange={handleChange} placeholder="Phone" required className="w-full border border-purple-200 rounded-xl px-4 py-3" />
          </div>
  
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-lg text-gray-800 mb-1">User Type</label>
              <select name="userType" value={regInfo.userType} onChange={handleChange} required className="w-full border border-purple-200 rounded-xl px-4 py-3">
                <option value="">Select user type</option>
                {userTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.display}</option>
                ))}
              </select>
            </div>
  
            <div>
              <label className="block font-bold text-lg text-gray-800 mb-1">Gender</label>
              <select name="sex" value={regInfo.sex} onChange={handleChange} required className="w-full border border-purple-200 rounded-xl px-4 py-3">
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>
  
          <div>
            <label className="block font-bold text-lg text-gray-800 mb-1">Address</label>
            <input name="address" value={regInfo.address} onChange={handleChange} placeholder="Address" required className="w-full border border-purple-200 rounded-xl px-4 py-3" />
          </div>
  
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-3 transition-all duration-200">
            {loading ? "Updating..." : creating ? "Create Account" : "Update Registration"}
          </button>
  
          {message && (
            <div className="mt-4 text-center text-red-600">{message}</div>
          )}
        </form>
      </div>
    </div>
  );
  
};

export default UpdateRegistration;
