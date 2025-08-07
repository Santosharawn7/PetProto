import React from "react";

export default function ChatModal({ open, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      {/* Overlay click closes modal */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close modal"
        tabIndex={-1}
        role="button"
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 md:mx-0 max-h-[90vh] flex flex-col animate-fadeIn z-10">
        {/* X icon in corner */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-pink-600 bg-gray-100 hover:bg-pink-100 rounded-full p-2 z-20 shadow focus:outline-none focus:ring-2 focus:ring-pink-400"
          aria-label="Close chat modal"
          tabIndex={0}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
        {/* Children: pass in Messages.jsx or whatever you want */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          {children}
        </div>
      </div>
    </div>
  );
}
