import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { auth } from "../../firebase";
import io from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || "http://127.0.0.1:5000";
const PLACEHOLDER_AVATAR = "https://ui-avatars.com/api/?name=Pet&background=random";

// Helper for date headers
function formatDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

export default function MobileChat({ friend, chatId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingMsgs, setLoadingMsgs] = useState(true);

  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const currentUid = auth.currentUser?.uid;

  // Load messages on mount or chatId change
  useEffect(() => {
    let isMounted = true;
    if (!chatId) return;
    const fetchMessages = async () => {
      setLoadingMsgs(true);
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await axios.get(`${API_URL}/chats/${chatId}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (isMounted) setMessages(res.data.messages || []);
      } finally {
        if (isMounted) setLoadingMsgs(false);
      }
    };
    fetchMessages();
    return () => { isMounted = false; };
  }, [chatId]);

  // Setup socket for new messages
  useEffect(() => {
    if (!chatId) return;
    socketRef.current = io(API_URL, { transports: ['websocket', 'polling'], timeout: 20000 });
    socketRef.current.on('new_message', (msg) => {
      if (msg.chatId === chatId) {
        setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
      }
    });
    return () => { socketRef.current?.disconnect(); };
  }, [chatId]);

  // Scroll to bottom when new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send a message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input.trim();
    const tempMsg = {
      id: `temp_${Date.now()}`,
      from: currentUid,
      text,
      sentAt: new Date().toISOString(),
      authorName: 'You',
      isTemporary: true
    };
    setMessages(prev => [...prev, tempMsg]);
    setInput("");
    try {
      const token = await auth.currentUser.getIdToken();
      await axios.post(
        `${API_URL}/chats/${chatId}/messages`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setInput(text);
    }
  };

  // HEADER
  const header = (
    <div className="rounded-2xl flex items-center px-4 py-4 border-b bg-gradient-to-r from-pink-500 to-purple-600 sticky top-0 z-20">
      <button
        className="text-white mr-3 hover:text-gray-200"
        aria-label="Back"
        onClick={onBack}
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <img
        src={friend.avatarUrl || friend.avatar || PLACEHOLDER_AVATAR}
        className="w-9 h-9 rounded-full border-2 border-green-500 mr-2"
        alt={friend.displayName}
      />
      <span className="text-white text-lg font-bold">{friend.displayName}</span>
    </div>
  );

  // INPUT (Sticky Bottom)
  const inputFooter = (
    <form
      onSubmit={handleSend}
      className="flex items-center px-3 py-2 border-t bg-white sticky bottom-0 z-10"
      style={{ borderRadius: "0 0 1rem 1rem" }}
    >
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        className="flex-1 pl-3 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all text-sm"
        placeholder="Message..."
      />
      <button
        type="submit"
        disabled={!input.trim()}
        className={`ml-2 p-3 rounded-full transition-all flex-shrink-0 ${
          input.trim()
            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </form>
  );

  // BODY
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col md:hidden">
      {header}
      <div className="flex-1 overflow-y-auto px-3 py-3 bg-white" style={{ minHeight: 0 }}>
        {loadingMsgs ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        ) : messages.length ? (
          (() => {
            // Date group & timestamp logic
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
              const isConsecutive = idx > 0 &&
                messages[idx - 1].from === m.from &&
                (msgDate - new Date(messages[idx - 1].sentAt)) < 60000;
              return (
                <React.Fragment key={m.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="px-3 py-1 text-xs text-gray-500 bg-white rounded-full font-medium shadow-sm">
                        {msgDateStr}
                      </span>
                    </div>
                  )}
                  <div className={`flex items-end mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && !isConsecutive && (
                      <div className="mr-2 mb-1">
                        <img
                          src={friend.avatarUrl || friend.avatar || PLACEHOLDER_AVATAR}
                          alt={friend.displayName}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      </div>
                    )}
                    {!isMe && isConsecutive && <div className="w-8"></div>}
                    <div className={`max-w-xs ${isMe ? 'ml-auto' : ''}`}>
                      <div
                        className={`px-4 py-2 rounded-2xl relative ${
                          isMe
                            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white ml-auto'
                            : 'bg-white text-gray-900 shadow-sm'
                        } ${isConsecutive ? 'mt-1' : 'mt-2'}`}
                        style={{
                          borderBottomRightRadius: isMe && !isConsecutive ? '6px' : '18px',
                          borderBottomLeftRadius: !isMe && !isConsecutive ? '6px' : '18px',
                        }}
                      >
                        <p className="text-sm leading-relaxed break-words">{m.text}</p>
                        {(idx === messages.length - 1 ||
                          messages[idx + 1]?.from !== m.from ||
                          (new Date(messages[idx + 1]?.sentAt) - msgDate) > 60000) && (
                          <div className={`text-xs opacity-70 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                            {msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            });
          })()
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.862 9.862 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No messages yet</p>
            <p className="text-gray-400 text-sm mt-1">Send a message to start the conversation</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {inputFooter}
    </div>
  );
}
