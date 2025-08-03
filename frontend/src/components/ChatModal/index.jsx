import React from "react";

export default function ChatModal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 rounded-2xl">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 md:mx-0 max-h-[90vh] flex flex-col animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-pink-600 bg-gray-100 hover:bg-pink-100 rounded-full p-2 z-10 shadow"
          aria-label="Close chat modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
