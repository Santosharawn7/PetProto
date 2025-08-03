import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { auth } from '../../firebase';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || 'http://127.0.0.1:5000';

function formatDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
}

export default function ChatArea({ chatId, currentChat, onBackToChats, socket, isMobile }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);

  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const currentUid = auth.currentUser?.uid;

  // Auto-scroll to bottom on new messages
  useEffect(() => { 
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  // Setup socket listeners for this chat
  useEffect(() => {
    if (!socket || !chatId) return;

    const handleNewMessage = (message) => {
      console.log('Received new message:', message);
      if (message.chatId === chatId) {
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          if (prev.find(msg => msg.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
      }
    };

    const handleUserTyping = (data) => {
      console.log('Typing event:', data);
      if (data.chatId === chatId) {
        if (data.isTyping) {
          setTypingUsers(prev => {
            // Check if user is already in typing list
            if (prev.find(user => user.userId === data.userId)) {
              return prev;
            }
            return [...prev, { userId: data.userId, userName: data.userName }];
          });
        } else {
          setTypingUsers(prev => prev.filter(user => user.userId !== data.userId));
        }
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);

    // Join the chat room
    joinChatRoom();

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
    };
  }, [socket, chatId]);

  // Fetch messages when chatId changes
  useEffect(() => {
    if (chatId) {
      fetchMessages();
    }
  }, [chatId]);

  // Join socket.io chat room
  const joinChatRoom = async () => {
    if (!socket || !chatId) return;
    
    try {
      const token = await auth.currentUser.getIdToken();
      console.log('Joining chat room:', chatId);
      socket.emit('join_chat', { chatId, token });
    } catch (error) {
      console.error('Failed to join chat room:', error);
    }
  };

  // Fetch messages for selected chat
  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      const token = await auth.currentUser.getIdToken();
      console.log('Fetching messages for chat:', chatId);
      const response = await axios.get(`${API_URL}/chats/${chatId}/messages`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      console.log('Messages loaded:', response.data.messages);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  // Message sending
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !chatId) return;

    handleStopTyping();
    const messageText = input.trim();
    
    // Create temporary message for immediate UI feedback
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
      console.log('Sending message to chat:', chatId);
      await axios.post(
        `${API_URL}/chats/${chatId}/messages`,
        { text: messageText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Remove temporary message - real message will come via socket
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove temporary message and restore input on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      toast.error('Failed to send message');
      setInput(messageText);
    }
  };

  // Typing indicator
  const handleTyping = async () => {
    if (!isTyping && socket && chatId) {
      setIsTyping(true);
      try {
        const token = await auth.currentUser.getIdToken();
        socket.emit('typing_start', { chatId, token });
      } catch (error) {
        console.error('Failed to send typing start:', error);
      }
    }
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { 
      handleStopTyping(); 
    }, 3000);
  };

  const handleStopTyping = async () => {
    if (isTyping && socket && chatId) {
      setIsTyping(false);
      try {
        const token = await auth.currentUser.getIdToken();
        socket.emit('typing_stop', { chatId, token });
      } catch (error) {
        console.error('Failed to send typing stop:', error);
      }
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (e.target.value.trim()) {
      handleTyping();
    } else {
      handleStopTyping();
    }
  };

  const otherDisplayName = currentChat?.otherUserName || "Chat";
  const otherUserAvatar = currentChat?.otherUserAvatar;

  return (
    <>
      {/* --- Chat Header --- */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <button
            onClick={onBackToChats}
            className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="flex-shrink-0">
              {otherUserAvatar ? (
                <img src={otherUserAvatar} alt="Profile" className="w-10 h-10 rounded-full object-cover ring-2 ring-pink-500" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">{otherDisplayName.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-gray-900 text-base truncate">{otherDisplayName}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* --- Messages Container --- */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 bg-gray-50">
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
                      <div className="mr-2 mb-1 flex-shrink-0">
                        {otherUserAvatar ? (
                          <img src={otherUserAvatar} alt="Profile" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-xs">
                              {(m.authorName || "A").charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {!isMe && isConsecutive && <div className="w-8 flex-shrink-0"></div>}
                    <div className={`max-w-xs sm:max-w-sm lg:max-w-md ${isMe ? 'ml-auto' : ''}`}>
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
      <div className="px-4 sm:px-6 py-4 bg-white border-t border-gray-200 safe-area-inset-bottom">
        <form onSubmit={handleSend} className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
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
  );
}