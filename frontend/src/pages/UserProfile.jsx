// src/pages/UserProfile.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../firebase";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Shield,
  Store,
  Stethoscope,
  Users,
  PawPrint,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  process.env.VITE_API_URL ||
  "http://127.0.0.1:5000";

// Animated GlassRow with shimmer
const GlassRow = ({ icon: Icon, title, value, gradient }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-white/30 bg-white/60 backdrop-blur-lg p-4 shadow-lg hover:shadow-[0_12px_28px_rgba(0,0,0,0.15)] hover:scale-[1.02] transition-all duration-300">
    {/* Shimmer on hover */}
    <div className="absolute inset-0 bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 opacity-0 group-hover:opacity-30 transition-opacity animate-pulse rounded-2xl"></div>

    <div className="relative flex items-start gap-4">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
        style={{
          background: gradient,
          backgroundSize: "400% 400%",
          animation: "gradientShift 6s ease infinite",
        }}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-wide font-medium text-slate-600">
          {title}
        </p>
        <p className="text-sm font-semibold text-slate-900 break-words">
          {value}
        </p>
      </div>
    </div>
  </div>
);

export default function UserProfile({ onEdit }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Animated gradient CSS
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const unsub = auth.onIdTokenChanged(async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setError("Not logged in");
        setLoading(false);
        return;
      }

      setLoading(true);
      async function load(withRefresh) {
        const token = await fbUser.getIdToken(withRefresh);
        const res = await axios.get(`${API_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
      }

      try {
        const data = await load(false);
        setUser(data);
        setError("");
      } catch (e1) {
        try {
          const data = await load(true);
          setUser(data);
          setError("");
        } catch (e2) {
          const status = e2?.response?.status;
          setUser(null);
          setError(status === 404 ? "Profile Not Found" : "Failed to load profile");
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
          <p className="text-gray-700 font-medium">Loading your profile...</p>
        </div>
      </div>
    );

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border border-white/20">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {error || "Profile Not Found"}
          </h2>
          <p className="text-gray-600">
            Please make sure you're logged in to view your profile.
          </p>
        </div>
      </div>
    );

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.displayName ||
    auth.currentUser?.displayName ||
    "User";

  const avatarInitial = (
    user.firstName?.[0] ||
    user.displayName?.[0] ||
    auth.currentUser?.displayName?.[0] ||
    "U"
  ).toUpperCase();

  // User type config with animated gradients & glow
  const getUserTypeConfig = (userType) => {
    const configs = {
      admin: {
        gradient: "linear-gradient(270deg, #f72585, #7209b7, #3a0ca3)",
        glow: "rgba(247,37,133,0.4)",
        icon: Shield,
        label: "Admin",
      },
      pet_parent: {
        gradient: "linear-gradient(270deg, #f43f5e, #fb923c, #f472b6)",
        glow: "rgba(251,146,60,0.4)",
        icon: PawPrint,
        label: "Pet Parent",
      },
      pet_shop_owner: {
        gradient: "linear-gradient(270deg, #22d3ee, #06b6d4, #3b82f6)",
        glow: "rgba(34,211,238,0.4)",
        icon: Store,
        label: "Pet Shop Owner",
      },
      veterinarian: {
        gradient: "linear-gradient(270deg, #4ade80, #86efac, #16a34a)",
        glow: "rgba(34,197,94,0.4)",
        icon: Stethoscope,
        label: "Veterinarian",
      },
      pet_sitter: {
        gradient: "linear-gradient(270deg, #fb923c, #f472b6, #f43f5e)",
        glow: "rgba(251,146,60,0.4)",
        icon: Users,
        label: "Pet Sitter",
      },
    };
    return configs[userType] || {
      gradient: "linear-gradient(270deg, #8b5cf6, #6366f1, #3b82f6)",
      glow: "rgba(129,140,248,0.4)",
      icon: User,
      label: userType || "Member",
    };
  };

  const userConfig = getUserTypeConfig(user.userType);
  const UserTypeIcon = userConfig.icon;

  return (
    <div className="min-h-screen py-4 px-4 sm:py-8 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/20 mb-6">
          <div className="relative">
            <div
              className="h-32 sm:h-40 relative overflow-hidden"
              style={{
                background: userConfig.gradient,
                backgroundSize: "600% 600%",
                animation: "gradientShift 10s ease infinite",
              }}
            >
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
            </div>

            {/* Avatar */}
            <div className="absolute -bottom-12 sm:-bottom-16 left-1/2 transform -translate-x-1/2">
              <div
                className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center border-4 border-white shadow-2xl"
                style={{
                  background: userConfig.gradient,
                  backgroundSize: "600% 600%",
                  animation: "gradientShift 10s ease infinite",
                  boxShadow: `0 0 30px ${userConfig.glow}`,
                }}
              >
                <span className="text-2xl sm:text-3xl font-bold text-white">{avatarInitial}</span>
              </div>
            </div>
          </div>

          {/* Name + handle + badge */}
          <div className="pt-16 sm:pt-20 pb-6 sm:pb-8 px-6 sm:px-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 break-words">{fullName}</h1>
            <p className="text-lg text-gray-500 mb-4 break-words">@{user.preferredUsername || user.username || "user"}</p>
            <div
              className="inline-flex items-center px-4 py-2 rounded-full text-white font-semibold text-sm shadow-lg"
              style={{
                background: userConfig.gradient,
                backgroundSize: "200% 200%",
                animation: "gradientShift 5s ease infinite",
              }}
            >
              <UserTypeIcon className="w-4 h-4 mr-1" />
              {userConfig.label}
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact */}
          <div className="rounded-2xl border border-white/30 bg-white/70 backdrop-blur-md p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
              <User className="w-5 h-5 mr-3 text-purple-600" />
              Contact Information
            </h2>
            <div className="space-y-4">
              <GlassRow icon={Mail} title="Email Address" value={user.email} gradient={userConfig.gradient} />
              <GlassRow icon={Phone} title="Phone Number" value={user.phone || "Not provided"} gradient={userConfig.gradient} />
            </div>
          </div>

          {/* Personal */}
          <div className="rounded-2xl border border-white/30 bg-white/70 backdrop-blur-md p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
              <PawPrint className="w-5 h-5 mr-3 text-purple-600" />
              Personal Information
            </h2>
            <div className="space-y-4">
              <GlassRow icon={User} title="Gender" value={user.sex || "Not specified"} gradient={userConfig.gradient} />
              <GlassRow icon={MapPin} title="Address" value={user.address || "Not provided"} gradient={userConfig.gradient} />
            </div>
          </div>
        </div>

        {/* Edit button */}
        <div className="mt-6">
          <button
            onClick={onEdit ? onEdit : () => (window.location.href = "/profile/edit")}
            className="w-full text-white font-semibold py-4 px-6 rounded-2xl shadow-xl flex items-center justify-center space-x-3 transition-all duration-300 transform hover:scale-[1.02]"
            style={{
              background: userConfig.gradient,
              backgroundSize: "200% 200%",
              animation: "gradientShift 5s ease infinite",
            }}
          >
            <Edit3 className="w-5 h-5" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
