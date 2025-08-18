import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { auth } from "../../firebase";
import io from "socket.io-client";

const API_URL =
  import.meta.env.VITE_API_URL ||
  process.env.VITE_API_URL ||
  "http://127.0.0.1:5000";

const PLACEHOLDER_AVATAR =
  "https://ui-avatars.com/api/?name=Pet&background=random";

function formatDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ChatFloater({ onClose, onExpand }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedChat, setSelectedChat] = useState(null); // { chatId, displayName, avatarUrl }
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const currentUid = auth.currentUser?.uid;

  // Fetch friends
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const res = await axios.get(`${API_URL}/approved-friends`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (mounted) setFriends(res.data.friends || []);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Select or create chat
  const handleFriendClick = async (friend) => {
    setLoadingMsgs(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      const chatsRes = await axios.get(`${API_URL}/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let chat =
        (chatsRes.data.chats || []).find(
          (c) => !c.isGroup && c.participants?.includes(friend.uid)
        ) || null;

      if (!chat) {
        const createRes = await axios.post(
          `${API_URL}/chats`,
          { participants: [user.uid, friend.uid], isGroup: false },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        chat = { id: createRes.data.chatId };
      }

      setSelectedChat({
        chatId: chat.id,
        displayName: friend.displayName,
        avatarUrl: friend.avatarUrl,
      });
    } finally {
      setLoadingMsgs(false);
    }
  };

  // Load messages when chat selected
  useEffect(() => {
    if (!selectedChat || !auth.currentUser) return;

    let mounted = true;
    (async () => {
      setLoadingMsgs(true);
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await axios.get(
          `${API_URL}/chats/${selectedChat.chatId}/messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (mounted) setMessages(res.data.messages || []);
      } catch (e) {
        console.error(e);
        if (mounted) setMessages([]);
      } finally {
        if (mounted) setLoadingMsgs(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedChat]);

  // Socket live updates
  useEffect(() => {
    if (!selectedChat || !auth.currentUser) return;

    socketRef.current = io(API_URL, {
      transports: ["websocket", "polling"],
      timeout: 20000,
    });

    (async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        socketRef.current.emit("join_chat", {
          chatId: selectedChat.chatId,
          token,
        });
      } catch (e) {
        console.error("join_chat error:", e);
      }
    })();

    const onNew = (msg) => {
      if (msg.chatId === selectedChat.chatId) {
        setMessages((prev) =>
          prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]
        );
      }
    };
    socketRef.current.on("new_message", onNew);

    return () => {
      try {
        socketRef.current?.emit("leave_chat", { chatId: selectedChat.chatId });
      } finally {
        socketRef.current?.off("new_message", onNew);
        socketRef.current?.disconnect();
      }
    };
  }, [selectedChat]);

  // Autoscroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedChat || !auth.currentUser) return;
    const text = input.trim();
    setInput("");

    const temp = {
      id: `temp_${Date.now()}`,
      from: currentUid,
      text,
      sentAt: new Date().toISOString(),
      authorName: "You",
      isTemporary: true,
    };
    setMessages((p) => [...p, temp]);

    try {
      const token = await auth.currentUser.getIdToken();
      await axios.post(
        `${API_URL}/chats/${selectedChat.chatId}/messages`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages((p) => p.filter((m) => m.id !== temp.id));
    } catch (e) {
      console.error(e);
      setMessages((p) => p.filter((m) => m.id !== temp.id));
      setInput(text);
    }
  };

  // ---------- Header (fixed, non-scrolling) ----------
  const header = (
    <div
      className="flex items-center px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 flex-shrink-0 z-20"
      style={{ borderRadius: "0.75rem 0.75rem 0 0" }}
    >
      {selectedChat && (
        <button
          className="text-white mr-3 hover:text-gray-200"
          aria-label="Back"
          onClick={() => setSelectedChat(null)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {selectedChat ? (
        <>
          <img
            src={selectedChat.avatarUrl || PLACEHOLDER_AVATAR}
            className="w-9 h-9 rounded-full border-2 border-green-500 mr-2 object-cover"
            alt={selectedChat.displayName}
          />
          <span className="text-white text-base font-bold truncate">
            {selectedChat.displayName}
          </span>
        </>
      ) : (
        <span className="text-white text-lg font-bold tracking-wide">Chats</span>
      )}
      <div className="flex-1" />
      <button
        onClick={onExpand}
        className="text-white hover:text-gray-200 mr-2"
        title="Expand"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M4 8V6a2 2 0 0 1 2-2h2m8 0h2a2 2 0 0 1 2 2v2m0 8v2a2 2 0 0 1-2 2h-2m-8 0H6a2 2 0 0 1-2-2v-2" />
        </svg>
      </button>
      <button onClick={onClose} className="text-white hover:text-gray-200" title="Close">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  // ---------- Input (fixed, non-scrolling) ----------
  const inputFooter = selectedChat && (
    <form
      onSubmit={handleSend}
      className="flex items-center px-3 py-2 border-t bg-white flex-shrink-0 z-10"
      style={{ borderRadius: "0 0 0.75rem 0.75rem" }}
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="flex-1 pl-3 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all text-sm"
        placeholder="Message..."
      />
      <button
        type="submit"
        disabled={!input.trim()}
        className={`ml-2 p-3 rounded-full transition-all flex-shrink-0 ${
          input.trim()
            ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7l7 7-7 7" />
        </svg>
      </button>
    </form>
  );

  // ---------- Friends list ----------
  if (!selectedChat) {
    return (
      <div className="flex flex-col h-full min-h-0 rounded-xl shadow-lg bg-white overflow-hidden">
        {header}
        <div
          className="flex-1 min-h-0 overflow-y-auto"
          style={{ WebkitOverflowScrolling: "touch" }}
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
                  className="flex items-center px-4 py-3 gap-4 cursor-pointer hover:bg-gray-200 active:bg-purple-100 transition-all duration-200 border-b border-gray-200 last:border-b-0"
                  onClick={() => handleFriendClick(friend)}
                >
                  <img
                    src={friend.avatarUrl || PLACEHOLDER_AVATAR}
                    alt={friend.displayName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-green-500 shadow-sm"
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
      </div>
    );
  }

  // ---------- Chat mode ----------
  return (
    <div className="flex flex-col h-full min-h-0 relative rounded-xl bg-white shadow-lg overflow-hidden">
      {header}

      {/* Only the messages scroll */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-3 py-3 bg-white"
        style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
      >
        {loadingMsgs ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
          </div>
        ) : messages.length ? (
          (() => {
            return messages.map((m, idx) => {
              const isMe = m.from === currentUid;
              const msgDate = new Date(m.sentAt);
              const showDate =
                idx === 0 ||
                formatDate(new Date(messages[idx - 1].sentAt)) !==
                  formatDate(msgDate);

              const isConsecutive =
                idx > 0 &&
                messages[idx - 1].from === m.from &&
                msgDate - new Date(messages[idx - 1].sentAt) < 60000;

              return (
                <React.Fragment key={m.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="px-3 py-1 text-xs text-gray-500 bg-white rounded-full font-medium shadow-sm">
                        {formatDate(msgDate)}
                      </span>
                    </div>
                  )}

                  <div className={`flex items-end mb-1 ${isMe ? "justify-end" : "justify-start"}`}>
                    {!isMe && !isConsecutive && (
                      <div className="mr-2 mb-1">
                        <img
                          src={selectedChat.avatarUrl || PLACEHOLDER_AVATAR}
                          alt={selectedChat.displayName}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      </div>
                    )}
                    {!isMe && isConsecutive && <div className="w-8" />}

                    <div className={`max-w-xs ${isMe ? "ml-auto" : ""}`}>
                      <div
                        className={`px-4 py-2 rounded-2xl relative ${
                          isMe
                            ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white ml-auto"
                            : "bg-white text-gray-900 shadow-sm"
                        } ${isConsecutive ? "mt-1" : "mt-2"}`}
                        style={{
                          borderBottomRightRadius: isMe && !isConsecutive ? "6px" : "18px",
                          borderBottomLeftRadius: !isMe && !isConsecutive ? "6px" : "18px",
                        }}
                      >
                        <p className="text-sm leading-relaxed break-words">{m.text}</p>

                        {(idx === messages.length - 1 ||
                          messages[idx + 1]?.from !== m.from ||
                          new Date(messages[idx + 1]?.sentAt) - msgDate > 60000) && (
                          <div className={`text-xs opacity-70 mt-1 ${isMe ? "text-right" : "text-left"}`}>
                            {msgDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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