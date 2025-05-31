import React, { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
// You can use a default avatar or pet paw icon if avatar is missing.
const PLACEHOLDER_AVATAR = "https://ui-avatars.com/api/?name=Pet&background=random";

export default function FriendList() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
    return () => { isMounted = false; }
  }, []);

  // Optionally: Add last message, unread, etc, if you want
  const openChat = async (friendUid) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      // Find or create chat with that friend
      const res = await axios.get(`${API_URL}/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let chat = (res.data.chats || []).find(
        c => !c.isGroup && c.participants && c.participants.includes(friendUid)
      );
      if (!chat) {
        // Create if not exists
        const createRes = await axios.post(`${API_URL}/chats`, {
          participants: [user.uid, friendUid],
          isGroup: false
        }, { headers: { Authorization: `Bearer ${token}` } });
        chat = { id: createRes.data.chatId };
      }
      navigate(`/chat/${chat.id}`);
    } catch (err) {
      alert("Could not open chat. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-xs bg-white rounded-xl shadow p-0" style={{ minWidth: 260 }}>
      <h2 className="text-center font-bold text-xl px-4 py-3 border-b-3">Chats</h2>
      {loading ? (
        <div className="text-center text-gray-400 py-6">Loading…</div>
      ) : friends.length === 0 ? (
        <div className="text-center text-gray-400 py-6">No friends yet.</div>
      ) : (
        <ul>
          {friends.map((friend) => (
            <li
              key={friend.uid}
              className="
                flex items-center px-3 py-2 gap-3 cursor-pointer
                hover:bg-gray-200 active:bg-gray-400 transition
                border-b
              "
              tabIndex={0}
              onClick={() => openChat(friend.uid)}
            >
              <img
                src={friend.avatarUrl || PLACEHOLDER_AVATAR}
                alt={friend.displayName}
                className="w-11 h-11 rounded-full object-cover border-green-500 border-3"
              />
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="font-semibold text-base text-gray-900 truncate">
                  {friend.displayName}
                </span>
                {/* If you have last message, time, show here */}
                {/* <span className="text-gray-500 text-sm truncate">Last message…</span> */}
              </div>
              {/* Optionally, show unread dot or time here */}
              {/* <span className="ml-auto text-xs text-gray-400">2:13 PM</span> */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
