import React, { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || "http://127.0.0.1:5000";
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

  const openChat = async (friendUid) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await axios.get(`${API_URL}/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let chat = (res.data.chats || []).find(
        c => !c.isGroup && c.participants && c.participants.includes(friendUid)
      );
      if (!chat) {
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
    <div
      className="
        w-full
        max-h-[60vh]
        overflow-y-auto
        bg-white
        rounded-xl
        shadow
        p-0
        md:max-w-xs
      "
    >
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
                flex items-center px-4 py-3 gap-4 cursor-pointer
                hover:bg-gray-100 active:bg-gray-200 transition
                border-b
              "
              onClick={() => openChat(friend.uid)}
            >
              <img
                src={friend.avatarUrl || PLACEHOLDER_AVATAR}
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
