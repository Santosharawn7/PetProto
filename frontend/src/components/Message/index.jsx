import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../../firebase';
import { toast } from 'react-toastify';
import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || 'http://127.0.0.1:5000';

// Helper to format date as "Friday, May 17, 2024"
function formatDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

// Helper to format time for message timestamps
function formatTime(date) {
  const now = new Date();
  const msgDate = new Date(date);
  const diffTime = now - msgDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return msgDate.toLocaleDateString([], { weekday: 'short' });
  } else {
    return msgDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

export default function Messages() {
  const [friends, setFriends] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChatsList, setShowChatsList] = useState(true);
  
  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const navigate = useNavigate();
  
  const currentUid = auth.currentUser?.uid;

  // Initialize Socket.IO
  useEffect(() => {
    if (!auth.currentUser) return;

    console.log('🔌 Initializing Socket.IO connection');
    socketRef.current = io(API_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Connected to server');
    });

    socketRef.current.on('new_message', (message) => {
      console.log('📨 Received new message:', message);
      
      // Only add if it's for the current chat
      if (selectedChatId && message.chatId === selectedChatId) {
        setMessages(prev => {
          if (prev.find(msg => msg.id === message.id)) {
            return prev; // Avoid duplicates
          }
          return [...prev, message];
        });
      }
      
      // Update chats list with new message
      fetchChats();
    });

    socketRef.current.on('user_typing', (data) => {
      if (data.isTyping) {
        setTypingUsers(prev => {
          if (!prev.find(user => user.userId === data.userId)) {
            return [...prev, { userId: data.userId, userName: data.userName }];
          }
          return prev;
        });
      } else {
        setTypingUsers(prev => prev.filter(user => user.userId !== data.userId));
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch friends and chats on mount
  useEffect(() => {
    if (auth.currentUser) {
      fetchFriends();
      fetchChats();
    }
  }, []);

  // Join chat room when selectedChatId changes
  useEffect(() => {
    if (selectedChatId && socketRef.current && auth.currentUser) {
      joinChatRoom(selectedChatId);
    }
  }, [selectedChatId]);

  const fetchFriends = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await axios.get(`${API_URL}/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriends(response.data.friends || []);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
      toast.error('Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const fetchChats = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await axios.get(`${API_URL}/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChats(response.data.chats || []);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
      toast.error('Failed to load chats');
    }
  };

  const fetchMessages = async (chatId) => {
    setLoadingMessages(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await axios.get(`${API_URL}/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const joinChatRoom = async (chatId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      socketRef.current.emit('join_chat', {
        chatId: chatId,
        token: token
      });
    } catch (error) {
      console.error('Failed to join chat room:', error);
    }
  };

  const startChatWithFriend = async (friendUid) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await axios.post(`${API_URL}/chat-with-user/${friendUid}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const chatId = response.data.chatId;
      setSelectedChatId(chatId);
      setShowChatsList(false);
      await fetchMessages(chatId);
      await fetchChats(); // Refresh chats list
    } catch (error) {
      console.error('Failed to start chat:', error);
      toast.error('Failed to start chat');
    }
  };

  const selectChat = async (chatId) => {
    setSelectedChatId(chatId);
    setShowChatsList(false);
    await fetchMessages(chatId);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedChatId) return;

    handleStopTyping();
    
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
      
      // Remove temporary message - real one will come via Socket.IO
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      toast.error('Failed to send message');
      setInput(messageText);
    }
  };

  const handleTyping = async () => {
    if (!isTyping && socketRef.current && selectedChatId) {
      setIsTyping(true);
      try {
        const token = await auth.currentUser.getIdToken();
        socketRef.current.emit('typing_start', {
          chatId: selectedChatId,
          token: token
        });
      } catch (error) {
        console.error('Failed to send typing indicator:', error);
      }
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 3000);
  };

  const handleStopTyping = async () => {
    if (isTyping && socketRef.current && selectedChatId) {
      setIsTyping(false);
      try {
        const token = await auth.currentUser.getIdToken();
        socketRef.current.emit('typing_stop', {
          chatId: selectedChatId,
          token: token
        });
      } catch (error) {
        console.error('Failed to stop typing indicator:', error);
      }
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (e.target.value.trim()) {
      handleTyping();
    } else {
      handleStopTyping();
    }
  };

  // Filter friends based on search
  const filteredFriends = friends.filter(friend =>
    friend.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter chats based on search
  const filteredChats = chats.filter(chat =>
    chat.otherUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessagePreview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get current chat details
  const currentChat = chats.find(chat => chat.id === selectedChatId);
  const otherDisplayName = currentChat?.otherUserName || "Chat";
  const otherUserAvatar = currentChat?.otherUserAvatar;

  if (!auth.currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Please log in to access messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Friends and Chats List */}
      <div className={`w-80 bg-white border-r border-gray-200 flex flex-col ${showChatsList ? 'block' : 'hidden md:block'}`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search messages"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all"
            />
            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
            </div>
          ) : (
            <>
              {/* Recent Chats */}
              {filteredChats.length > 0 && (
                <div className="mb-4">
                  <h3 className="px-6 py-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">Recent</h3>
                  {filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => selectChat(chat.id)}
                      className={`flex items-center px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedChatId === chat.id ? 'bg-pink-50 border-r-2 border-pink-500' : ''
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative">
                        {chat.otherUserAvatar ? (
                          <img
                            src={chat.otherUserAvatar}
                            alt={chat.otherUserName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">
                              {chat.otherUserName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Chat Info */}
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {chat.otherUserName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {chat.lastMessageTime && formatTime(chat.lastMessageTime)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500 truncate mt-1">
                          {chat.lastMessagePreview}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Friends List */}
              <div>
                <h3 className="px-6 py-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  {filteredChats.length > 0 ? 'All Friends' : 'Friends'}
                </h3>
                {filteredFriends.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">No friends found</p>
                    <p className="text-gray-400 text-xs mt-1">Add some friends to start chatting</p>
                  </div>
                ) : (
                  filteredFriends.map((friend) => (
                    <div
                      key={friend.uid}
                      onClick={() => startChatWithFriend(friend.uid)}
                      className="flex items-center px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      {/* Avatar */}
                      <div className="relative">
                        {friend.avatar ? (
                          <img
                            src={friend.avatar}
                            alt={friend.displayName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">
                              {friend.displayName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        
                        {/* Online indicator */}
                        {friend.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      
                      {/* Friend Info */}
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {friend.displayName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {friend.isOnline ? 'Online' : friend.lastSeen ? `Last seen ${formatTime(friend.lastSeen)}` : 'Offline'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChatId ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowChatsList(true)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="flex items-center space-x-3">
                  {otherUserAvatar ? (
                    <img
                      src={otherUserAvatar}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-pink-500"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {otherDisplayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  <div>
                    <h2 className="font-semibold text-gray-900 text-base">{otherDisplayName}</h2>
                  </div>
                </div>
              </div>
              
              {/* Chat actions */}
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
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
                    
                    const isConsecutive = idx > 0 && 
                      messages[idx - 1].from === m.from && 
                      (msgDate - new Date(messages[idx - 1].sentAt)) < 60000;
                    
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
                          {!isMe && !isConsecutive && (
                            <div className="mr-2 mb-1">
                              {otherUserAvatar ? (
                                <img
                                  src={otherUserAvatar}
                                  alt="Profile"
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                  <span className="text-white font-semibold text-xs">
                                    {(m.authorName || "A").charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {!isMe && isConsecutive && <div className="w-8"></div>}
                          
                          <div className={`max-w-xs lg:max-w-sm ${isMe ? 'ml-auto' : ''}`}>
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
              
              {/* Typing Indicator */}
              {typingUsers.length > 0 && (
                <div className="flex items-center space-x-2 px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {typingUsers.length === 1 
                      ? `${typingUsers[0].userName} is typing...`
                      : `${typingUsers.length} people are typing...`
                    }
                  </span>
                </div>
              )}
              
              <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className="px-6 py-4 bg-white border-t border-gray-200">
              <form onSubmit={handleSend} className="flex items-center space-x-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    placeholder="Message..."
                  />
                  <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z" />
                    </svg>
                  </button>
                </div>
                
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className={`p-3 rounded-full transition-all ${
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
            </div>
          </>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-16 h-16 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.862 9.862 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Messages</h2>
              <p className="text-gray-500 mb-6 max-w-sm">
                Send private photos and messages to a friend or group
              </p>
              <button
                onClick={() => setShowChatsList(true)}
                className="md:hidden px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transition-all"
              >
                Browse Messages
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}