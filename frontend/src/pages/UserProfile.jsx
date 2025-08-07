import React, { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../firebase"; // Make sure the path is correct!

const API_URL = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || 'http://127.0.0.1:5000';

export default function UserProfile({ onEdit }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      // Wait for auth to be ready and a user to be logged in
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await axios.get(`${API_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    // Optionally, you could listen for auth changes and refresh profile
    // eslint-disable-next-line
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
          <p className="text-gray-600">Please make sure you're logged in to view your profile.</p>
        </div>
      </div>
    );
  }

  const getUserTypeColor = (userType) => {
    const colors = {
      admin: "bg-red-100 text-red-700 border-red-200",
      pet_parent: "bg-blue-100 text-blue-700 border-blue-200",
      pet_shop_owner: "bg-green-100 text-green-700 border-green-200",
      veterinarian: "bg-purple-100 text-purple-700 border-purple-200",
      pet_sitter: "bg-orange-100 text-orange-700 border-orange-200"
    };
    return colors[userType] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getUserTypeLabel = (userType) => {
    const labels = {
      admin: "Admin",
      pet_parent: "Pet Parent",
      pet_shop_owner: "Pet Shop Owner",
      veterinarian: "Veterinarian",
      pet_sitter: "Pet Sitter"
    };
    return labels[userType] || userType;
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
        {/* Header Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 h-32 relative">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {(user.firstName?.[0] || user.displayName?.[0] || "U").toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="pt-20 pb-8 px-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {user.displayName || `${user.firstName} ${user.lastName}`}
            </h1>
            <p className="text-lg text-gray-500 mb-4">@{user.preferredUsername}</p>
            <div className="inline-flex items-center">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getUserTypeColor(user.userType)}`}>
                {getUserTypeLabel(user.userType)}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Details Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            Profile Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Email Address</p>
                  <p className="text-gray-800 font-medium">{user.email}</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Phone Number</p>
                  <p className="text-gray-800 font-medium">{user.phone || "Not provided"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Gender</p>
                  <p className="text-gray-800 font-medium">{user.sex || "Not specified"}</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Address</p>
                  <p className="text-gray-800 font-medium">{user.address || "Not provided"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Button */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onEdit ? onEdit : () => window.location.href = "/profile/edit"}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              <span>Edit Profile</span>
            </button>
          </div>
      </div>
    </div>
  );
}