import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getCurrentUser } from '@/services/userService';
import FriendList from "../FriendList";
import LogoOmniverse from '../../assets/LogoOmniverse.png';
import { FaPaw, FaBell, FaSearch } from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi';
import { AiFillHome } from 'react-icons/ai';
import { MdGroups } from 'react-icons/md';
import { FiMessageCircle } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const Header = ({ onSearchClick }) => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMessages, setShowMessages] = useState(false); // <-- NEW
  const dropdownRef = useRef(null);
  const messagesRef = useRef(null); // <-- NEW

  // Fetch incoming friend requests
  const fetchRequests = async () => {
    const token = localStorage.getItem("userToken");
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const incoming = res.data.incoming || [];
      setRequests(incoming.filter((r) => r.status === "pending"));
    } catch (err) {
      console.error("Failed to load requests", err);
    }
  };

  useEffect(() => {
    fetchRequests();
    // Close dropdowns when clicking outside
    const onClick = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        messagesRef.current &&
        !messagesRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
        setShowMessages(false);
      }
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  const handleRespond = async (requestId, action) => {
    const token = localStorage.getItem("userToken");
    try {
      await axios.post(
        `${API_URL}/requests/${requestId}/respond`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Request ${action}ed`);
      setRequests((rs) => rs.filter((r) => r.id !== requestId));
    } catch (err) {
      console.error(`Failed to ${action}`, err);
      toast.error(err.response?.data?.error || `Failed to ${action}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    navigate("/login");
  };

  const handleProfileClick = async () => {
    const token = localStorage.getItem("userToken");
    if (!token) return navigate("/login");
    try {
      const res = await getCurrentUser(token);
      if (res.data.petProfile) navigate("/pet-profile");
      else navigate("/pet-profile", { state: { edit: true } });
    } catch {
      navigate("/pet-profile", { state: { edit: true } });
    }
  };

  return (
    <header className="w-full pb-8 flex justify-between items-center">
      {/* Left: Logo / Title */}
      <div className="flex items-center">
        <a href="/home">
        <img
          src={LogoOmniverse}
          alt="Omniverse of Pets Logo"
          className="h-36 w-auto ml-8"
          // style={{ maxHeight: "65px" }} // adjust as needed
        />
        </a>
        {/* Optional: You can add a small text beside the logo if you want */}
        {/* <span className="text-2xl font-bold ml-2">Omniverse of Pets</span> */}
      </div>

    {/* Center nav */}
      <nav className="flex space-x-8 items-center text-gray-700 font-extrabold mr-12">
        <div className="flex items-center gap-2">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `flex items-center gap-1 ${isActive ? 'text-green-500 underline' : 'hover:text-blue-700'}`
            }
          >
            <AiFillHome className="text-xl" /> {/* Adjust size as needed */}
            <span>Home</span>
          </NavLink>
        </div>

        <div className="flex items-center gap-2">
          <NavLink
            to="/community"
            className={({ isActive }) =>
              `flex items-center gap-1 ${isActive ? 'text-green-500 underline' : 'hover:text-blue-700'}`
            }
          >
            <MdGroups className="text-2xl" />
            <span>Community</span>
          </NavLink>
        </div>


        {/* 🔍 Search Icon */}
        <button
          onClick={() => {
            console.log('Search icon clicked'); // ✅ add this
            onSearchClick();}}
          className="flex items-center gap-2 hover:text-blue-700"
          title="Search Pets"
        >
          <FaSearch className="text-xl" />
          Search
        </button>

        {/* 🐾 Pet Profile */}
        <button
          onClick={handleProfileClick}
          className="flex items-center gap-2 hover:text-blue-700"
        >
          <FaPaw className="text-xl" />
          My Pet Profile
        </button>

        {/* Messages (Friend List) */}
        <div className="relative" ref={messagesRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMessages((v) => !v);
              setShowDropdown(false);
            }}
            className="flex items-center gap-2 hover:text-blue-700"
            title="Messages"
          >
            < FiMessageCircle className="text-xl" />
            Message
          </button>
          {showMessages && (
            <div
              className="absolute right-0 mt-2 w-72 bg-white border rounded shadow-lg z-30"
              style={{ maxHeight: 350, overflowY: "auto" }}
            >
              <FriendList mini />
              {/* Optional: link to full messages page */}
              <button
                className="w-full text-blue-600 py-2 hover:bg-gray-50 border-t"
                onClick={() => {
                  setShowMessages(false);
                  navigate("/chat");
                }}
              >
                See all messages
              </button>
            </div>
          )}
        </div>

        {/* 🔔 Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown((v) => !v);
                setShowMessages(false); // 👈 Close Messages when Notifications is clicked
              }}
              className="flex items-center gap-2 hover:text-blue-700"
              title="Requests"
          >
            <FaBell className="text-xl" />
            Notification
            {requests.length > 0 && (
              <span className="absolute -top-1 -right-3 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {requests.length}
              </span>
            )}
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-white border rounded shadow-lg z-20">
              {requests.length === 0 ? (
                <p className="p-4 text-center text-gray-600">No new requests</p>
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

        {/* 🚪 Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 hover:text-red-600"
        >
          <FiLogOut className="text-xl" />
          Logout
        </button>
      </nav>

    </header>
  );
};

export default Header;


