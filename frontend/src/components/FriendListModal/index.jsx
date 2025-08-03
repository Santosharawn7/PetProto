import React, { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../../firebase";

const API_URL = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || "http://127.0.0.1:5000";
const PLACEHOLDER_AVATAR = "https://ui-avatars.com/api/?name=Pet&background=random";

export default function FriendListModal({ open, onClose, onSelectFriend }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    const fetchFriends = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setFriends([]);
          setLoading(false);
          return;
        }
        const token = await user.getIdToken();
        const res = await axios.get(`${API_URL}/approved-friends`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFriends(res.data.friends || []);
      } catch {
        setFriends([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchFriends();
    return () => { isMounted = false; }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed bottom-28 right-7 z-50 bg-white rounded-2xl shadow-2xl border w-80 max-h-96 overflow-y-auto p-0 animate-fadeIn">
      <div className="flex justify-between items-center p-4 border-b">
        <div className="font-bold text-lg">Friends</div>
        <button
          className="text-gray-400 hover:text-pink-600 p-1"
          onClick={onClose}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      {loading ? (
        <div className="text-center text-gray-400 py-6">Loading…</div>
      ) : friends.length === 0 ? (
        <div className="text-center text-gray-400 py-6">No friends yet.</div>
      ) : (
        <ul>
          {friends.map((friend) => (
            <li
              key={friend.uid}
              className="flex items-center px-4 py-3 gap-4 cursor-pointer hover:bg-gray-100 active:bg-gray-200 transition border-b"
              onClick={() => onSelectFriend(friend)}
            >
              <img
                src={friend.avatarUrl || friend.avatar || PLACEHOLDER_AVATAR}
                alt={friend.displayName}
                className="w-12 h-12 rounded-full object-cover border-2 border-green-500"
              />
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="font-semibold text-base text-gray-900 truncate">
                  {friend.displayName}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
