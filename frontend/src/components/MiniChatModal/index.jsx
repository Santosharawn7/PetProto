import React from "react";

export default function MiniChatModal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed z-50 right-8 bottom-28">
      <div className="bg-white rounded-xl shadow-2xl w-[370px] max-h-[70vh] flex flex-col border border-gray-200">
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
