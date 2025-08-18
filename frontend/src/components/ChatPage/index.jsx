import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../../firebase';
import { toast } from 'react-toastify';
import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || 'http://127.0.0.1:5000';

function formatDate(date) {
  return date.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export default function ChatPage() {
  const { chatId: paramChatId } = useParams();
  const navigate = useNavigate();
  const [otherUserAvatar, setOtherUserAvatar] = useState(null);
  const [otherUserName, setOtherUserName] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const currentUid = auth.currentUser?.uid;

  useEffect(() => {
    if (!paramChatId || !auth.currentUser) return;

    socketRef.current = io(API_URL, { transports: ['websocket', 'polling'], timeout: 20000 });

    socketRef.current.on('new_message', (message) => {
      setMessages(prev => prev.find(msg => msg.id === message.id) ? prev : [...prev, message]);
    });

    socketRef.current.on('user_typing', (data) => {
      if (data.isTyping) {
        setTypingUsers(prev => prev.find(u => u.userId === data.userId) ? prev : [...prev, { userId: data.userId, userName: data.userName }]);
      } else {
        setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
      }
    });

    (async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        socketRef.current.emit('join_chat', { chatId: paramChatId, token });
      } catch {}
    })();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_chat', { chatId: paramChatId });
        socketRef.current.disconnect();
      }
    };
  }, [paramChatId]);

  const fetchMessages = async (chatId) => {
    setLoadingMsgs(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await axios.get(`${API_URL}/chats/${chatId}/messages`, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(res.data.messages || []);
      localStorage.setItem(`chat_${chatId}_lastSeen`, Date.now());
    } catch {
      toast.error('Could not load messages');
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  };

  const fetchChatMetadata = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await axios.get(`${API_URL}/chats`, { headers: { Authorization: `Bearer ${token}` } });
      const currentChat = (res.data.chats || []).find(chat => chat.id === paramChatId);
      if (currentChat) {
        setOtherUserAvatar(currentChat.otherUserAvatar);
        setOtherUserName(currentChat.otherUserName);
      } else {
        setOtherUserAvatar(null);
        setOtherUserName('Chat');
      }
    } catch {
      setOtherUserAvatar(null);
      setOtherUserName('Chat');
    }
  };

  useEffect(() => {
    if (paramChatId && auth.currentUser) {
      fetchMessages(paramChatId);
      fetchChatMetadata();
    }
    const poll = setInterval(() => {
      if (paramChatId && !loadingMsgs && auth.currentUser) fetchMessages(paramChatId);
    }, 5000);
    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramChatId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleStopTyping = async () => {
    if (socketRef.current && paramChatId) {
      try {
        const token = await auth.currentUser.getIdToken();
        socketRef.current.emit('typing_stop', { chatId: paramChatId, token });
      } catch {}
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = null;
  };

  const handleTyping = async () => {
    if (socketRef.current && paramChatId) {
      try {
        const token = await auth.currentUser.getIdToken();
        socketRef.current.emit('typing_start', { chatId: paramChatId, token });
      } catch {}
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(handleStopTyping, 3000);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (e.target.value.trim()) handleTyping(); else handleStopTyping();
  };

  const handleSend = async e => {
    e.preventDefault();
    if (!input.trim()) return;
    handleStopTyping();

    const messageText = input.trim();
    const tempMessage = { id: `temp_${Date.now()}`, from: currentUid, text: messageText, sentAt: new Date().toISOString(), authorName: 'You', isTemporary: true };
    setMessages(prev => [...prev, tempMessage]);
    setInput('');

    try {
      const token = await auth.currentUser.getIdToken();
      await axios.post(`${API_URL}/chats/${paramChatId}/messages`, { text: messageText }, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      toast.error('Failed to send message');
      setInput(messageText);
    }
  };

  if (!auth.currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Please log in to access chat</p>
        </div>
      </div>
    );
  }

  if (!paramChatId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-500">No chat selected</p>
          <button onClick={() => navigate('/messages')} className="mt-4 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600">
            Go to Messages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen min-h-0 bg-white">
      {/* Header (not sticky; just non-flexible) */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0 z-10">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate('/messages')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex items-center space-x-3">
            {otherUserAvatar ? (
              <img src={otherUserAvatar} alt="Profile" className="w-10 h-10 rounded-full object-cover ring-2 ring-pink-500" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">{otherUserName.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <h2 className="font-semibold text-gray-900 text-base">{otherUserName}</h2>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </button>
        </div>
      </div>

      {/* Messages (only this scrolls) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 bg-gray-50">
        {loadingMsgs ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        ) : messages.length ? (
          (() => {
            return messages.map((m, idx) => {
              const isMe = m.from === currentUid;
              const msgDate = new Date(m.sentAt);
              const msgDateStr = formatDate(msgDate);
              const showDate = idx === 0 || formatDate(new Date(messages[idx - 1].sentAt)) !== msgDateStr;
              const isConsecutive = idx > 0 && messages[idx - 1].from === m.from && (msgDate - new Date(messages[idx - 1].sentAt)) < 60000;

              return (
                <React.Fragment key={m.id}>
                  {showDate && (
                    <div className="flex justify-center my-6">
                      <span className="px-3 py-1 text-xs text-gray-500 bg-white rounded-full font-medium shadow-sm">{msgDateStr}</span>
                    </div>
                  )}
                  <div className={`flex items-end mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && !isConsecutive && (
                      <div className="mr-2 mb-1">
                        {otherUserAvatar ? (
                          <img src={otherUserAvatar} alt="Profile" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-xs">{(m.authorName || "A").charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {!isMe && isConsecutive && <div className="w-8"></div>}
                    <div className={`max-w-xs lg:max-w-sm ${isMe ? 'ml-auto' : ''}`}>
                      <div
                        className={`px-4 py-2 rounded-2xl relative ${isMe ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white ml-auto' : 'bg-white text-gray-900 shadow-sm'} ${isConsecutive ? 'mt-1' : 'mt-2'}`}
                        style={{
                          borderBottomRightRadius: isMe && !isConsecutive ? '6px' : '18px',
                          borderBottomLeftRadius: !isMe && !isConsecutive ? '6px' : '18px',
                        }}
                      >
                        <p className="text-sm leading-relaxed break-words">{m.text}</p>
                        {(idx === messages.length - 1 || messages[idx + 1]?.from !== m.from || (new Date(messages[idx + 1]?.sentAt) - msgDate) > 60000) && (
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
              {/* icon */}
            </div>
            <p className="text-gray-500 font-medium">No messages yet</p>
            <p className="text-gray-400 text-sm mt-1">Send a message to start the conversation</p>
          </div>
        )}

        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 px-4 py-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-sm text-gray-500">
              {typingUsers.length === 1 ? `${typingUsers[0].userName} is typing...` : `${typingUsers.length} people are typing...`}
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input (non-flexible) */}
      <div className="px-4 py-3 bg-white border-t border-gray-200 flex-shrink-0">
        <form onSubmit={handleSend} className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              placeholder="Message..."
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim()}
            className={`p-3 rounded-full transition-all ${input.trim() ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
}