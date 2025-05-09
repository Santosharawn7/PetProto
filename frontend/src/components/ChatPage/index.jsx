// src/components/ChatPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import axios from 'axios';
import { auth, db } from '../../firebase';
import { toast } from 'react-toastify';
import { doc, getDoc } from 'firebase/firestore';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export default function ChatPage() {
  const { chatId: paramChatId } = useParams();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const bottomRef = useRef(null);

  const currentUid = auth.currentUser?.uid;

  // auth headers helper
  const getAuthHeaders = async () => {
    const token = await auth.currentUser.getIdToken();
    return { Authorization: `Bearer ${token}` };
  };

  // Fetch chat list
  const fetchChats = async () => {
    setLoadingChats(true);
    try {
      const headers = await getAuthHeaders();
      const res = await axios.get(`${API_URL}/chats`, { headers });
      const raw = res.data.chats || [];
      // enrich with other user info and unseen flag
      const enriched = await Promise.all(
        raw.map(async c => {
          const otherUid = c.participants.find(uid => uid !== currentUid);
          let otherName = otherUid;
          try {
            const snap = await getDoc(doc(db, 'users', otherUid));
            const ud = snap.data() || {};
            otherName =
              ud.petProfile?.name ||
              ud.preferredUsername ||
              `${ud.firstName || ''} ${ud.lastName || ''}`.trim() ||
              otherUid;
          } catch {
            // fallback to UID
          }
          // determine unseen
          const lastSeen = Number(localStorage.getItem(`chat_${c.id}_lastSeen`)) || 0;
          const lastUpdated = c.lastUpdated
            ? new Date(c.lastUpdated).valueOf()
            : 0;
          const unseen = lastUpdated > lastSeen;
          return {
            id: c.id,
            otherUid,
            otherName,
            lastUpdated,
            unseen
          };
        })
      );
      // sort by lastUpdated descending
      enriched.sort((a, b) => b.lastUpdated - a.lastUpdated);
      setChats(enriched);
    } catch (err) {
      console.error('Failed to load chats', err);
      toast.error('Could not load chats');
    } finally {
      setLoadingChats(false);
    }
  };

  // Fetch messages for the selected chat
  const fetchMessages = async chatId => {
    setLoadingMsgs(true);
    try {
      const headers = await getAuthHeaders();
      const res = await axios.get(
        `${API_URL}/chats/${chatId}/messages`,
        { headers }
      );
      setMessages(res.data.messages);
      // mark as seen
      localStorage.setItem(`chat_${chatId}_lastSeen`, Date.now());
      // update unseen flag
      setChats(cs =>
        cs.map(c =>
          c.id === chatId ? { ...c, unseen: false } : c
        )
      );
    } catch (err) {
      console.error('Failed to fetch messages', err);
      toast.error('Could not load messages');
    } finally {
      setLoadingMsgs(false);
    }
  };

  // On mount load chats
  useEffect(() => {
    fetchChats();
  }, []);

  // When paramChatId or chats change, fetch messages
  useEffect(() => {
    if (paramChatId) {
      fetchMessages(paramChatId);
    }
  }, [paramChatId]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send a message
  const handleSend = async e => {
    e.preventDefault();
    if (!input.trim()) return;
    try {
      const headers = await getAuthHeaders();
      await axios.post(
        `${API_URL}/chats/${paramChatId}/messages`,
        { text: input.trim() },
        { headers }
      );
      setInput('');
      fetchMessages(paramChatId);
    } catch (err) {
      console.error('Send message error', err);
      toast.error('Failed to send');
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r overflow-y-auto">
        <h2 className="p-4 font-semibold border-b">Chats</h2>
        {loadingChats ? (
          <p className="p-4 text-center text-gray-500">Loading…</p>
        ) : (
          <ul>
            {chats.map(c => (
              <li key={c.id}>
                <NavLink
                  to={`/chat/${c.id}`}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition ${
                      isActive ? 'bg-gray-200 font-semibold' : ''
                    }`
                  }
                >
                  <span>{c.otherName}</span>
                  {c.unseen && (
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  )}
                </NavLink>
              </li>
            ))}
            {chats.length === 0 && (
              <p className="p-4 text-gray-600">No chats yet.</p>
            )}
          </ul>
        )}
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center p-4 bg-white shadow">
          <button
            onClick={() => navigate('/home')}
            className="mr-4 text-2xl"
          >
            &larr;
          </button>
          <h1 className="text-xl font-semibold">
            {chats.find(c => c.id === paramChatId)?.otherName || 'Chat'}
          </h1>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-2">
          {loadingMsgs ? (
            <p className="text-center">Loading messages…</p>
          ) : messages.length ? (
            messages.map(m => {
              const isMe = m.from === currentUid;
              return (
                <div
                  key={m.id}
                  className={`flex ${
                    isMe ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-green-600 text-white rounded-bl-none'
                    }`}
                  >
                    <p>{m.text}</p>
                    <div className="text-xs text-right opacity-75 mt-1">
                      {new Date(m.sentAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-500">No messages yet.</p>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSend}
          className="flex p-4 bg-white border-t"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 border rounded-l px-4 py-2 focus:outline-none"
            placeholder="Type a message…"
          />
          <button
            type="submit"
            className="px-4 bg-blue-600 text-white rounded-r hover:bg-blue-700"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
