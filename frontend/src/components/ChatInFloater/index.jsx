import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { auth } from "../../firebase";
import { toast } from "react-toastify";
import io from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || "http://127.0.0.1:5000";

export default function ChatInFloater({ chatId, friend }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const currentUid = auth.currentUser?.uid;

  useEffect(() => {
    if (!chatId || !auth.currentUser) return;

    socketRef.current = io(API_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    socketRef.current.emit('join_chat', {
      chatId,
      token: auth.currentUser.getIdToken(),
    });

    socketRef.current.on('new_message', (message) => {
      setMessages(prev => prev.find(msg => msg.id === message.id) ? prev : [...prev, message]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_chat', { chatId });
        socketRef.current.disconnect();
      }
    };
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    setLoadingMsgs(true);
    const fetchMessages = async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await axios.get(`${API_URL}/chats/${chatId}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(res.data.messages || []);
      } catch {
        setMessages([]);
      } finally {
        setLoadingMsgs(false);
      }
    };
    fetchMessages();
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const messageText = input.trim();
    setInput("");
    const tempMessage = {
      id: `temp_${Date.now()}`,
      from: currentUid,
      text: messageText,
      sentAt: new Date().toISOString(),
      authorName: "You",
      isTemporary: true,
    };
    setMessages(prev => [...prev, tempMessage]);
    try {
      const token = await auth.currentUser.getIdToken();
      await axios.post(
        `${API_URL}/chats/${chatId}/messages`,
        { text: messageText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    } catch {
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      toast.error("Failed to send message");
      setInput(messageText);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 rounded-3xl overflow-y-auto px-3 py-2 bg-white">
        {loadingMsgs ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        ) : messages.length ? (
          messages.map((m) => {
            const isMe = m.from === currentUid;
            return (
              <div
                key={m.id}
                className={`flex items-end mb-1 ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-xs sm:max-w-sm ${isMe ? "ml-auto" : ""}`}>
                  <div
                    className={`px-4 py-2 rounded-2xl relative ${
                      isMe
                        ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white ml-auto"
                        : "bg-white text-gray-900 shadow-sm"
                    } mt-2`}
                  >
                    <p className="text-sm leading-relaxed break-words">{m.text}</p>
                    <div className={`text-xs opacity-70 mt-1 ${isMe ? "text-right" : "text-left"}`}>
                      {new Date(m.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.862 9.862 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No messages yet</p>
            <p className="text-gray-400 text-sm mt-1">Send a message to start the conversation</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="px-3 py-2 bg-white border-t border-gray-200">
        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-sm"
            placeholder="Message..."
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className={`p-2 rounded-full transition-all ${
              input.trim()
                ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg hover:shadow-xl"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
