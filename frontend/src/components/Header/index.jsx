// src/components/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getCurrentUser } from '@/services/userService';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const Header = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch incoming friend requests
  const fetchRequests = async () => {
    const token = localStorage.getItem('userToken');
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const incoming = res.data.incoming || [];
      setRequests(incoming.filter(r => r.status === 'pending'));
    } catch (err) {
      console.error('Failed to load requests', err);
    }
  };

  useEffect(() => {
    fetchRequests();
    // Close dropdown when clicking outside
    const onClick = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  const handleRespond = async (requestId, action) => {
    const token = localStorage.getItem('userToken');
    try {
      await axios.post(
        `${API_URL}/requests/${requestId}/respond`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Request ${action}ed`);
      setRequests(rs => rs.filter(r => r.id !== requestId));
    } catch (err) {
      console.error(`Failed to ${action}`, err);
      toast.error(err.response?.data?.error || `Failed to ${action}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    navigate('/login');
  };

  const handleProfileClick = async () => {
    const token = localStorage.getItem('userToken');
    if (!token) return navigate('/login');
    try {
      const res = await getCurrentUser(token);
      if (res.data.petProfile) navigate('/pet-profile');
      else navigate('/pet-profile', { state: { edit: true } });
    } catch {
      navigate('/pet-profile', { state: { edit: true } });
    }
  };

  return (
    <header className="flex items-center justify-between p-4 bg-white shadow mb-6 relative">
      {/* Left: Logo / Title */}
      <div className="text-2xl font-bold">PetDate</div>

      {/* Center: Nav Links */}
      <nav>
        <ul className="flex space-x-6">
          <li>
            <NavLink
              to="/home"
              className={({ isActive }) =>
                isActive
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-700 hover:text-blue-600'
              }
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/community"
              className={({ isActive }) =>
                isActive
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-700 hover:text-blue-600'
              }
            >
              Community
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Right: Actions */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(v => !v)}
            className="p-2 bg-white rounded-full hover:bg-gray-100 relative"
            title="Requests"
          >
            🔔
            {requests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {requests.length}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-white border rounded shadow-lg z-20">
              {requests.length === 0 ? (
                <p className="p-4 text-center text-gray-600">
                  No new requests
                </p>
              ) : (
                requests.map(r => (
                  <div
                    key={r.id}
                    className="flex justify-between items-center px-4 py-2 border-b last:border-none"
                  >
                    <span className="truncate">From: {r.from}</span>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleRespond(r.id, 'accept')}
                        className="px-2 py-1 bg-green-600 text-white rounded"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespond(r.id, 'reject')}
                        className="px-2 py-1 bg-red-600 text-white rounded"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Profile */}
        <button
          onClick={handleProfileClick}
          className="p-2 bg-white border-2 border-blue-600 text-blue-600 rounded-full hover:bg-blue-50"
          title="Edit Pet Profile"
        >
          🐾
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="px-4 py-2 border-2 border-red-600 text-red-600 rounded hover:bg-red-600 hover:text-white"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
