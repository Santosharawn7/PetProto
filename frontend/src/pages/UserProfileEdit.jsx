// src/pages/UserProfileEdit.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { auth } from "../firebase";

const API_URL =
  import.meta.env.VITE_API_URL ||
  process.env.VITE_API_URL ||
  "http://127.0.0.1:5000";

const GENDERS = ["Male", "Female", "Other"];
const USER_TYPES = [
  { value: "admin", label: "Admin" },
  { value: "pet_parent", label: "Pet Parent" },
  { value: "pet_shop_owner", label: "Pet Shop Owner" },
  { value: "veterinarian", label: "Veterinarian" },
  { value: "pet_sitter", label: "Pet Sitter" },
];

export default function UserProfileEdit({ onCancel, onSave }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Robust Firebase auth/profile fetch
  useEffect(() => {
    const unsub = auth.onIdTokenChanged(async (u) => {
      if (!u) {
        setForm(null);
        setError("Not logged in");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Try cached token first
        const token = await u.getIdToken(false);
        const res = await axios.get(`${API_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setForm(res.data);
        setError("");
      } catch {
        // If it fails (e.g., expired), force refresh token once
        try {
          const token = await u.getIdToken(true);
          const res = await axios.get(`${API_URL}/user/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setForm(res.data);
          setError("");
        } catch {
          setForm(null);
          setError("Failed to load profile");
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="text-gray-700 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border border-white/20">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border border-white/20">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
          <p className="text-gray-600">Unable to load your profile data.</p>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setForm((f) => ({
      ...f,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const token = await auth.currentUser.getIdToken();
      await axios.put(`${API_URL}/user/profile`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSaving(false);
      if (onSave) onSave();
      else navigate("/profile");
    } catch (err) {
      setSaving(false);
      setError("Failed to save profile. " + (err.response?.data?.error || ""));
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Edit Profile</h1>
        <p className="text-gray-600">Update your personal information</p>
      </div>

      {/* Glass card with purple header bar */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/20">
        <div className="bg-gradient-to-r from-purple-700 via-fuchsia-600 to-indigo-700 h-20 relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 -mt-10 relative">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/30">
            {/* Personal Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Personal Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                  <input
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    name="firstName"
                    value={form.firstName || ""}
                    onChange={handleChange}
                    placeholder="Enter your first name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                  <input
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    name="lastName"
                    value={form.lastName || ""}
                    onChange={handleChange}
                    placeholder="Enter your last name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                  <input
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    name="preferredUsername"
                    value={form.preferredUsername || ""}
                    onChange={handleChange}
                    placeholder="Choose a username"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    name="sex"
                    value={form.sex || ""}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
                    name="email"
                    value={form.email || ""}
                    disabled
                    placeholder="Email address"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <input
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    name="phone"
                    value={form.phone || ""}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                  <input
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    name="address"
                    value={form.address || ""}
                    onChange={handleChange}
                    placeholder="Enter your full address"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Account Type */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 00-2 2H6a2 2 0 00-2-2V4m8 0H8m0 0v2H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-2V6" />
                </svg>
                Account Type
              </h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">User Type</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  name="userType"
                  value={form.userType || ""}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select User Type</option>
                  {USER_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel ? onCancel : () => navigate("/profile")}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
                disabled={saving}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <span>Cancel</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-purple-700 via-fuchsia-600 to-indigo-700 hover:from-purple-800 hover:via-fuchsia-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:transform-none disabled:shadow-none flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
