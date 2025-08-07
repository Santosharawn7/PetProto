// src/pages/Messages.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { auth } from '../../firebase';
import { toast } from 'react-toastify';
import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || 'http://127.0.0.1:5000';
const PLACEHOLDER_AVATAR = "https://ui-avatars.com/api/?name=Pet&background=random";

// Helper to format date as "Friday, May 17, 2024"
function formatDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

export default function Messages() {
  const [friends, setFriends] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showChatsList, setShowChatsList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const currentUid = auth.currentUser?.uid;

  // --- Responsive ---
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setShowChatsList(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Fetch friends on load ---
  useEffect(() => {
    async function fetchFriends() {
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await axios.get(`${API_URL}/approved-friends`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFriends(res.data.friends || []);
      } catch {
        setFriends([]);
      }
    }
    if (auth.currentUser) fetchFriends();
  }, []);

  // --- Socket for real-time messages ---
  useEffect(() => {
    if (!auth.currentUser || !selectedChatId) return;
    socketRef.current = io(API_URL, { transports: ['websocket', 'polling'], timeout: 20000 });

    socketRef.current.on('new_message', (message) => {
      if (message.chatId === selectedChatId) {
        setMessages(prev => prev.find(msg => msg.id === message.id) ? prev : [...prev, message]);
      }
    });

    return () => { socketRef.current?.disconnect(); };
    // eslint-disable-next-line
  }, [selectedChatId]);

  // --- Fetch messages when selectedChatId changes ---
  useEffect(() => {
    if (selectedChatId) fetchMessages(selectedChatId);
    // eslint-disable-next-line
  }, [selectedChatId, friends]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Get friend info for header ---
  const getFriendForChat = (chatId) => {
    let found = friends.find(f => f.chatId === chatId);
    if (found) return found;
    if (currentChat && currentChat.chatId === chatId) return currentChat;
    return null;
  };

  // --- Fetch messages for selected chatId ---
  const fetchMessages = async (chatId) => {
    setLoadingMessages(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await axios.get(`${API_URL}/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.messages || []);
      setCurrentChat(getFriendForChat(chatId));
    } catch {
      toast.error('Failed to load messages');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // --- Open or create chat with friend ---
  const handleFriendClick = async (friend) => {
    if (!friend) return;
    let chatId = friend.chatId;
    if (!chatId) {
      try {
        const token = await auth.currentUser.getIdToken();
        const response = await axios.post(`${API_URL}/chat-with-user/${friend.uid}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        chatId = response.data.chatId;
        setFriends(prevFriends =>
          prevFriends.map(f =>
            f.uid === friend.uid ? { ...f, chatId } : f
          )
        );
      } catch {
        toast.error('Could not start chat');
        return;
      }
    }
    setSelectedChatId(chatId);
    setCurrentChat({ ...friend, chatId });
    if (isMobile) setShowChatsList(false);
  };

  // --- Send message ---
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedChatId) return;
    const messageText = input.trim();
    const tempMessage = {
      id: `temp_${Date.now()}`,
      from: currentUid,
      text: messageText,
      sentAt: new Date().toISOString(),
      authorName: 'You',
      isTemporary: true
    };
    setMessages(prev => [...prev, tempMessage]);
    setInput('');
    try {
      const token = await auth.currentUser.getIdToken();
      await axios.post(
        `${API_URL}/chats/${selectedChatId}/messages`,
        { text: messageText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    } catch {
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      toast.error('Failed to send message');
      setInput(messageText);
    }
  };

  const handleBackToChats = () => {
    setShowChatsList(true);
    setSelectedChatId(null);
    setCurrentChat(null);
    setMessages([]);
  };

  if (!auth.currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Please log in to access messages</p>
        </div>
      </div>
    );
  }

  // --- Filter friends by search ---
  const filteredFriends = friends.filter(friend =>
    friend.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50 relative overflow-hidden rounded-3xl">
      {/* Mobile overlay */}
      {isMobile && !showChatsList && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setShowChatsList(true)}
        />
      )}

      {/* --- SIDEBAR: Friends List --- */}
      <div className={`
        ${isMobile ? 'fixed' : 'relative'}
        ${isMobile && !showChatsList ? '-translate-x-full' : 'translate-x-0'}
        ${isMobile ? 'w-full h-full z-20' : 'w-80'}
        bg-white border-r border-gray-200 flex flex-col
        transition-transform duration-300 ease-in-out
      `}>
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Friends</h1>
          <div className="relative">
            <input
              type="text"
              placeholder="Search friends"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all text-sm"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        {/* Sidebar Friend List Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {filteredFriends.length > 0 ? (
            <ul>
              {filteredFriends.map(friend => (
                <li
                  key={friend.uid}
                  className={`flex items-center px-4 py-3 gap-4 cursor-pointer hover:bg-gray-100 active:bg-gray-200 transition border-b ${
                    currentChat?.uid === friend.uid ? 'bg-pink-50' : ''
                  }`}
                  onClick={() => handleFriendClick(friend)}
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
          ) : (
            <div className="text-center text-gray-400 py-6">No friends yet.</div>
          )}
        </div>
      </div>

      {/* --- MAIN CHAT AREA --- */}
      <div className={`
        flex-1 flex flex-col h-full bg-gray-50
        ${isMobile && showChatsList ? 'hidden' : ''}
      `}>
        {selectedChatId && currentChat ? (
          <>
            {/* Fixed Chat Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 bg-white border-b border-gray-200 z-10">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <button
                  onClick={handleBackToChats}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                >
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="flex-shrink-0">
                    {currentChat?.avatarUrl ? (
                      <img src={currentChat.avatarUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-green-500" />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">{currentChat?.displayName?.charAt(0).toUpperCase() || '?'}</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-gray-900 text-base truncate">{currentChat?.displayName || 'Chat'}</h2>
                  </div>
                </div>
              </div>
            </div>
            {/* Scrollable Messages Container */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 chat-messages-scroll bg-gray-50 min-h-0">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                </div>
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
                    const isConsecutive =
                      idx > 0 &&
                      messages[idx - 1].from === m.from &&
                      (msgDate - new Date(messages[idx - 1].sentAt)) < 60000;
                    const showTime =
                      idx === messages.length - 1 ||
                      messages[idx + 1]?.from !== m.from ||
                      formatDate(new Date(messages[idx + 1]?.sentAt)) !== msgDateStr ||
                      (new Date(messages[idx + 1]?.sentAt) - msgDate) > 60000;
                    return (
                      <React.Fragment key={m.id}>
                        {showDate && (
                          <div className="flex justify-center my-6">
                            <span className="px-3 py-1 text-xs text-gray-500 bg-white rounded-full font-medium shadow-sm">
                              {msgDateStr}
                            </span>
                          </div>
                        )}
                        <div className={`flex items-end mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs sm:max-w-sm lg:max-w-md ${isMe ? 'ml-auto' : ''}`}>
                            <div
                              className={`px-4 py-2 rounded-2xl relative ${
                                isMe
                                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white ml-auto'
                                  : 'bg-white text-gray-900 shadow-sm'
                              } ${isConsecutive ? 'mt-1' : 'mt-2'}`}
                            >
                              <p className="text-sm leading-relaxed break-words">{m.text}</p>
                              {showTime && (
                                <div className={`text-xs opacity-70 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                                  {msgDate.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
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
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
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
            {/* Fixed Input Area */}
            <div className="flex-shrink-0 px-4 sm:px-6 py-4 bg-white border-t border-gray-200 safe-area-inset-bottom">
              <form onSubmit={handleSend} className="flex items-center space-x-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="Message..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className={`p-3 rounded-full transition-all flex-shrink-0 ${
                    input.trim()
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 px-4">
            <div className="text-center max-w-sm">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 sm:w-16 sm:h-16 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.862 9.862 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Your Messages</h2>
              <p className="text-gray-500 mb-6 text-sm sm:text-base">
                Send private photos and messages to a friend or group
              </p>
              <button
                onClick={() => setShowChatsList(true)}
                className="md:hidden px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transition-all active:scale-95"
              >
                Browse Friends
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
