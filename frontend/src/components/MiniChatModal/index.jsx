// MiniChatModal.jsx
import React, { useEffect } from "react";
import ReactDOM from "react-dom";

export default function MiniChatModal({ open, onClose, children }) {
  if (!open) return null;

  // prevent body scroll while open (optional)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* click-away area */}
      <button
        className="absolute inset-0 bg-transparent pointer-events-auto"
        onClick={onClose}
        aria-label="Close mini chat"
      />

      {/* Mini panel */}
      <div
        className="
          absolute right-4 bottom-24
          w-[360px] md:w-[400px]
          max-h-[78vh]                 /* <- cap, no fixed height */
          bg-white rounded-xl shadow-2xl border border-gray-200
          flex flex-col overflow-hidden /* shell never scrolls */
          pointer-events-auto
        "
        role="dialog"
        aria-modal="true"
      >
        {/* Child owns scrolling; min-h-0 lets inner flex areas actually overflow */}
        <div className="flex flex-col min-h-0">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}