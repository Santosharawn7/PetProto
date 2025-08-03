import React from "react";

export default function ChatFloaterIcon({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 md:bottom-6 right-6 z-50 p-4 rounded-full shadow-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white text-2xl hover:scale-110 transition-transform duration-150 flex items-center justify-center focus:outline-none"
      aria-label="Open Chat"
      style={{
        // Make sure it's above nav bar (give higher bottom on mobile)
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.25)'
      }}
    >
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.862 9.862 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    </button>
  );
}
