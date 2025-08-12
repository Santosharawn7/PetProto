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

/** Light glass-glow row with purple accents */
const GlassRow = ({ icon: Icon, title, value }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-purple-200/60 bg-white/60 backdrop-blur-lg p-4 shadow-[0_8px_24px_rgba(104,64,255,0.08)] hover:shadow-[0_12px_28px_rgba(104,64,255,0.18)] transition-shadow">
    <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/5 via-fuchsia-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="relative flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-purple-600" />
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
  const [loading, setLoading] = useState(true); // spinner
  const [error, setError] = useState(""); // optional message

  useEffect(() => {
    // Use onIdTokenChanged so we react to token refreshes and initial auth reliably
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
        // Try cached token first
        const data = await load(false);
        setUser(data);
        setError("");
      } catch (e1) {
        // If it fails (expired token etc.), force refresh once
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

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
          <p className="text-gray-700 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // No user / fetch error
  if (!user) {
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
  }

  // Prefer saved first/last name; fall back if needed
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

  // Purple gradients and icons per userType
  const getUserTypeConfig = (userType) => {
    const configs = {
      admin: {
        color: "from-purple-700 to-indigo-800",
        icon: Shield,
        label: "Admin",
      },
      pet_parent: {
        color: "from-fuchsia-600 to-purple-700",
        icon: PawPrint,
        label: "Pet Parent",
      },
      pet_shop_owner: {
        color: "from-violet-600 to-purple-800",
        icon: Store,
        label: "Pet Shop Owner",
      },
      veterinarian: {
        color: "from-purple-700 to-indigo-800",
        icon: Stethoscope,
        label: "Veterinarian",
      },
      pet_sitter: {
        color: "from-indigo-600 to-violet-700",
        icon: Users,
        label: "Pet Sitter",
      },
    };
    return (
      configs[userType] || {
        color: "from-purple-600 to-indigo-700",
        icon: User,
        label: userType || "Member",
      }
    );
  };

  const userConfig = getUserTypeConfig(user.userType);
  const UserTypeIcon = userConfig.icon;

  return (
    <div className="min-h-screen py-4 px-4 sm:py-8 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Profile Card (light glass header + purple gradient bar) */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/20 mb-6">
          <div className="relative">
            <div
              className={`h-32 sm:h-40 bg-gradient-to-r ${userConfig.color} relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
            </div>

            {/* Avatar */}
            <div className="absolute -bottom-12 sm:-bottom-16 left-1/2 transform -translate-x-1/2">
              <div
                className={`w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br ${userConfig.color} rounded-full border-4 border-white shadow-2xl flex items-center justify-center`}
              >
                <span className="text-2xl sm:text-3xl font-bold text-white">
                  {avatarInitial}
                </span>
              </div>
            </div>
          </div>

          {/* Name + handle + badge */}
          <div className="pt-16 sm:pt-20 pb-6 sm:pb-8 px-6 sm:px-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 break-words">
              {fullName}
            </h1>
            <p className="text-lg text-gray-500 mb-4 break-words">
              @{user.preferredUsername || user.username || "user"}
            </p>

            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-purple-600 text-white shadow-lg">
              <UserTypeIcon className="w-4 h-4" />
              <span className="font-semibold">{userConfig.label}</span>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact (light glass card) */}
          <div className="rounded-2xl border border-purple-200/50 bg-white/70 backdrop-blur-md p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
              <User className="w-5 h-5 mr-3 text-purple-600" />
              Contact Information
            </h2>

            <div className="space-y-4">
              <GlassRow icon={Mail} title="Email Address" value={user.email} />
              <GlassRow
                icon={Phone}
                title="Phone Number"
                value={user.phone || "Not provided"}
              />
            </div>
          </div>

          {/* Personal (light glass card) */}
          <div className="rounded-2xl border border-purple-200/50 bg-white/70 backdrop-blur-md p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
              <PawPrint className="w-5 h-5 mr-3 text-purple-600" />
              Personal Information
            </h2>

            <div className="space-y-4">
              <GlassRow
                icon={User}
                title="Gender"
                value={user.sex || "Not specified"}
              />
              <GlassRow
                icon={MapPin}
                title="Address"
                value={user.address || "Not provided"}
              />
            </div>
          </div>
        </div>

        {/* Edit button (kept purple gradient) */}
        <div className="mt-6">
          <button
            onClick={onEdit ? onEdit : () => (window.location.href = "/profile/edit")}
            className={`w-full bg-gradient-to-r ${userConfig.color} hover:shadow-2xl text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center space-x-3 shadow-xl`}
          >
            <Edit3 className="w-5 h-5" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
