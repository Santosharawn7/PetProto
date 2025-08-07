import React, { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../../firebase";

const API_URL = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || "http://127.0.0.1:5000";
const PLACEHOLDER_AVATAR = "https://ui-avatars.com/api/?name=Pet&background=random";

export default function MobileChatView({ onSelectFriend, onClose }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="fixed inset-0 bg-white z-40 flex flex-col md:hidden">
      {/* Header */}
      <div className="flex items-center px-4 py-4 border-b bg-gradient-to-r from-pink-500 to-purple-600 sticky top-0">
        <button
          className="text-white mr-2"
          onClick={onClose}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <span className="text-white text-xl font-bold">Chats</span>
      </div>
      <div className="flex-1 overflow-y-auto bg-white">
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
    </div>
  );
}
