import React, { useState } from 'react';
import ChatFloaterIcon from '../ChatFloaterIcon';
import FriendListModal from '../FriendListModal';
import ChatFloater from '../ChatFloater';
import ChatModal from '../ChatModal';
import Messages from '../Messages'; // Your existing Messages component

export default function ChatManager() {
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [openChats, setOpenChats] = useState([]); // Array of open chat floaters
  const [minimizedChats, setMinimizedChats] = useState({}); // Object to track minimized state
  const [expandedChat, setExpandedChat] = useState(null); // For full modal view

  // Handle clicking the main chat floater icon
  const handleFloaterClick = () => {
    setShowFriendsList(!showFriendsList);
  };

  // Handle selecting a friend from the friends list
  const handleFriendSelect = (friend) => {
    // Check if chat is already open
    const existingChat = openChats.find(chat => chat.friendId === friend.id);
    
    if (existingChat) {
      // If minimized, show it
      if (minimizedChats[existingChat.id]) {
        setMinimizedChats(prev => ({
          ...prev,
          [existingChat.id]: false
        }));
      }
    } else {
      // Create new chat floater
      const newChat = {
        id: Date.now(), // Use a better ID in production
        friendId: friend.id,
        otherUserName: friend.name,
        otherUserAvatar: friend.avatar,
        // Add other chat properties as needed
      };
      
      setOpenChats(prev => [...prev, newChat]);
    }
    
    // Close friends list after selection
    setShowFriendsList(false);
  };

  // Handle closing a chat floater
  const handleCloseChat = (chatId) => {
    setOpenChats(prev => prev.filter(chat => chat.id !== chatId));
    setMinimizedChats(prev => {
      const updated = { ...prev };
      delete updated[chatId];
      return updated;
    });
  };

  // Handle minimizing/maximizing a chat
  const handleMinimizeChat = (chatId, shouldMinimize) => {
    setMinimizedChats(prev => ({
      ...prev,
      [chatId]: shouldMinimize
    }));
  };

  // Handle expanding a chat to full modal
  const handleExpandChat = (chat) => {
    setExpandedChat(chat);
  };

  // Handle closing the expanded chat modal
  const handleCloseExpandedChat = () => {
    setExpandedChat(null);
  };

  return (
    <>
      {/* Main Chat Floater Icon */}
      <ChatFloaterIcon onClick={handleFloaterClick} />

      {/* Friends List Floater */}
      <FriendListModal
        open={showFriendsList}
        onClose={() => setShowFriendsList(false)}
        onSelectFriend={handleFriendSelect}
      />

      {/* Individual Chat Floaters */}
      {openChats.map((chat, index) => (
        <ChatFloater
          key={chat.id}
          chat={chat}
          position={index}
          isMinimized={minimizedChats[chat.id] || false}
          onClose={() => handleCloseChat(chat.id)}
          onMinimize={(shouldMinimize) => handleMinimizeChat(chat.id, shouldMinimize)}
          onExpand={() => handleExpandChat(chat)}
        />
      ))}

      {/* Expanded Chat Modal (Full Messenger View) */}
      <ChatModal
        open={!!expandedChat}
        onClose={handleCloseExpandedChat}
      >
        {expandedChat && (
          <Messages 
            initialChatId={expandedChat.friendId}
            initialChat={expandedChat}
            isModal={true}
          />
        )}
      </ChatModal>
    </>
  );
}