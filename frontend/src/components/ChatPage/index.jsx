import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../../firebase';
import { toast } from 'react-toastify';
import Header from '../Header';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

// Helper to format date as "Friday, May 17, 2024"
function formatDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

export default function ChatPage() {
  const { chatId: paramChatId } = useParams();
  const navigate = useNavigate();
  const [otherUserAvatar, setOtherUserAvatar] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const bottomRef = useRef(null);

  const currentUid = auth.currentUser?.uid;

  // Fetch messages for the selected chat
  const fetchMessages = async chatId => {
    setLoadingMsgs(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await axios.get(`${API_URL}/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data.messages);
      localStorage.setItem(`chat_${chatId}_lastSeen`, Date.now());
    } catch (err) {
      toast.error('Could not load messages');
    } finally {
      setLoadingMsgs(false);
    }
  };

  const fetchChatMetadata = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await axios.get(`${API_URL}/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const currentChat = res.data.chats.find(chat => chat.id === paramChatId);
      if (currentChat) {
        setOtherUserAvatar(currentChat.otherUserAvatar);
      }
    } catch {
      setOtherUserAvatar(null);
    }
  };
  
  fetchChatMetadata();
  
  useEffect(() => {
    if (paramChatId) {
      fetchMessages(paramChatId);
    }
    // eslint-disable-next-line
  }, [paramChatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async e => {
    e.preventDefault();
    if (!input.trim()) return;
    try {
      const token = await auth.currentUser.getIdToken();
      await axios.post(
        `${API_URL}/chats/${paramChatId}/messages`,
        { text: input.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInput('');
      fetchMessages(paramChatId);
    } catch (err) {
      toast.error('Failed to send');
    }
  };

  // Find other user's display name from first incoming message
  const otherDisplayName =
    messages.find(m => m.from !== currentUid)?.authorName || "Chat";

  return (
    <div className="flex flex-col h-screen ">
      <Header/>
      {/* Header Bar */}
      <header className="flex items-center -mt-4 p-5 border-b gap-3 bg-white">
        <button
          onClick={() => navigate('/home')}
          className="mr-2 text-2xl font-bold"
        >
          &larr;
        </button>
        {otherUserAvatar && (
          <img
            src={otherUserAvatar}
            alt="Pet Avatar"
            className="w-13 h-13 rounded-full object-cover border-green-500 border-3"
          />
        )}
        <h1 className="text-xl font-semibold">{otherDisplayName}</h1>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#fafafc]">
        {loadingMsgs ? (
          <p className="text-left text-gray-500">Loading messages…</p>
        ) : messages.length ? (
          (() => {
            let lastDate = null;
            return messages.map((m, idx) => {
              const isMe = m.from === currentUid;
              const msgDate = new Date(m.sentAt);
              const msgDateStr = formatDate(msgDate);
              let showDate = false;
              if (idx === 0 || formatDate(new Date(messages[idx - 1].sentAt)) !== msgDateStr) {
                showDate = true;
                lastDate = msgDateStr;
              }
              return (
                <React.Fragment key={m.id}>
                  {showDate && (
                    <div className="flex items-center my-4">
                      <div className="flex-1 border-t border-gray-200" />
                      <span className="mx-4 text-gray-400 text-sm">{msgDateStr}</span>
                      <div className="flex-1 border-t border-gray-200" />
                    </div>
                  )}
                  <div
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end`}
                  >
                    <div className="flex flex-col max-w-xs">
                      {/* Show display name for incoming */}
                      {!isMe && (
                        <div className="flex items-center gap-2 mb-1 ml-1">
                          <span className="text-xs text-gray-600 font-medium">
                            {m.authorName || "Anonymous"}
                          </span>
                        </div>
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl shadow-md ${
                          isMe
                            ? 'bg-gradient-to-tr from-blue-500 to-blue-400 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}
                        style={{
                          marginLeft: isMe ? "auto" : 0,
                          marginRight: !isMe ? "auto" : 0,
                          maxWidth: "350px",
                          wordBreak: "break-word"
                        }}
                      >
                        {m.text}
                        <div className="text-xs opacity-70 text-right mt-1">
                          {msgDate.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            });
          })()
        ) : (
          <p className="text-left text-gray-500">No messages yet.</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex p-4 border-t bg-white"
        style={{ boxShadow: '0 -1px 2px rgba(0,0,0,.02)' }}
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
  );
}
