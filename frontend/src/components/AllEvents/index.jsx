// components/community/AllEvents.jsx
import React, { useState, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ReactionButtons,
  Comments,
  RSVPButtons,
} from "../../config/CommunityCommon";
import { FaShare, FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { motion } from "framer-motion";

export default function AllEvents(props) {
  const {
    user,
    posts = [],
    events = [],
    openComments,
    setOpenComments,
    showDropdown,
    setShowDropdown,
    showDeleteModal,
    setShowDeleteModal,
    handleEdit,
    handleDelete,
    dropdownRefs,
    isAuthor,
    authHeaders,
  } = props;

  // Ensure ref object exists
  if (dropdownRefs && !dropdownRefs.current) dropdownRefs.current = {};

  // Share dropdown state/refs
  const [showShareDropdown, setShowShareDropdown] = useState({});
  const shareDropdownRefs = useRef({});

  useEffect(() => {
    const onDocClick = (e) => {
      Object.keys(showShareDropdown).forEach((key) => {
        if (
          showShareDropdown[key] &&
          shareDropdownRefs.current[key] &&
          !shareDropdownRefs.current[key].contains(e.target)
        ) {
          setShowShareDropdown((prev) => ({ ...prev, [key]: false }));
        }
      });
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showShareDropdown]);

  // Reusable author helpers
  const getAuthorName = (it) =>
    it?.authorName ||
    it?.author?.displayName ||
    it?.author?.name ||
    it?.user?.displayName ||
    it?.user?.name ||
    it?.createdBy?.name ||
    it?.createdByUsername ||
    (isAuthor(it) ? "You" : "User");

  const getAuthorInitial = (name) =>
    (name || "U").trim().charAt(0).toUpperCase() || "U";

  // Filter out past events (today+)
  const now = new Date();
  const visibleEvents = events.filter(
    (ev) => !ev.dateFilter || new Date(ev.dateFilter) >= now
  );

  const combined = [
    ...posts.map((p) => ({ ...p, __type: "post" })),
    ...visibleEvents.map((e) => ({ ...e, __type: "event" })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const CommentIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8-1.593 0-3.086-.308-4.405-.86L3 21l1.02-3.186C3.364 16.026 3 14.547 3 13c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );

  // Social share (FB/Twitter popups; IG/TikTok copy to clipboard + open site)
  const shareToSocial = async (platform, item) => {
    const isEvent = item.__type === "event";
    const itemUrl = `${window.location.origin}?${isEvent ? "event" : "post"}=${item.id}`;
    const baseText = isEvent ? "Check out this event: " : "Check out this post: ";
    const text = `${baseText}${item.title || (isEvent ? "Awesome Event" : "Great Post")}`;
    const desc = item.description ? ` - ${item.description}` : "";
    const combined = `${text}${desc}\n\n${itemUrl}`;
    const popup = "width=600,height=640";

    switch (platform) {
      case "facebook": {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          itemUrl
        )}&quote=${encodeURIComponent(text + desc)}`;
        window.open(url, "_blank", popup);
        return;
      }
      case "twitter": {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          text + desc
        )}&url=${encodeURIComponent(itemUrl)}`;
        window.open(url, "_blank", popup);
        return;
      }
      case "instagram": {
        try {
          await navigator.clipboard.writeText(combined);
        } catch {}
        window.open("https://www.instagram.com/", "_blank", popup);
        return;
      }
      case "tiktok": {
        try {
          await navigator.clipboard.writeText(combined);
        } catch {}
        window.open("https://www.tiktok.com/upload?lang=en", "_blank", popup);
        return;
      }
      default:
        return;
    }
  };

  if (combined.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No posts or events yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {combined.map((item, index) => {
        const key = item.__type + "-" + item.id;
        const authorName = getAuthorName(item);
        const authorInitial = getAuthorInitial(authorName);

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="rounded-3xl p-6 mb-6 text-left relative transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
            style={{
              background:
                "linear-gradient(135deg, rgba(255, 228, 235, 0.4) 0%, rgba(255, 222, 230, 0.35) 40%, rgba(245, 220, 255, 0.3) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              boxShadow:
                "0 6px 20px rgba(0,0,0,0.08), inset 0 1px 2px rgba(255,255,255,0.35)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
            }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            {/* Author controls */}
            {isAuthor(item) && (
              <div
                className="absolute top-4 right-4 z-10"
                ref={(el) => (dropdownRefs.current[key] = el)}
              >
                <button
                  onClick={() =>
                    setShowDropdown((prev) => ({ ...prev, [key]: !prev[key] }))
                  }
                  className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200"
                  aria-label="More actions"
                >
                  <svg
                    className="w-6 h-6 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                  </svg>
                </button>
                {showDropdown[key] && (
                  <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20">
                    <button
                      className="w-full text-left px-4 py-2 text-black hover:bg-gray-200 rounded-t-lg transition-all duration-200"
                      onClick={() => {
                        setShowDropdown({});
                        handleEdit(item);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-200 rounded-b-lg transition-all duration-200"
                      onClick={() => {
                        setShowDropdown({});
                        setShowDeleteModal((prev) => ({
                          ...prev,
                          [key]: true,
                        }));
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Delete modal */}
            {showDeleteModal[key] && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-30">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-sm w-full relative">
                  <h3 className="font-semibold text-lg mb-3 text-black dark:text-white">
                    Are you sure?
                  </h3>
                  <p className="mb-4 text-black dark:text-gray-300">
                    This will permanently delete your{" "}
                    {item.__type === "post" ? "post" : "event"}.
                  </p>
                  <div className="flex justify-end space-x-2">
                    <button
                      className="px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-600 text-black dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200"
                      onClick={() =>
                        setShowDeleteModal((prev) => ({
                          ...prev,
                          [key]: false,
                        }))
                      }
                    >
                      No
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors duration-200"
                      onClick={() => handleDelete(item)}
                    >
                      Yes, Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* BODY */}
            {item.__type === "post" ? (
              <>
                {/* Author block */}
                <div className="flex items-center mb-4 text-left">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full mr-3 flex items-center justify-center shadow-sm">
                    <span className="text-white font-semibold text-sm">
                      {authorInitial}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">{authorName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(item.createdAt))} ago
                    </p>
                  </div>
                </div>

                {/* Title */}
                {item.title && (
                  <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-3 text-left tracking-tight">
                    {item.title}
                  </h3>
                )}

                {/* Desc */}
                {item.description && (
                  <p className="text-gray-700 mb-4 leading-relaxed text-left">
                    {item.description}
                  </p>
                )}

                {/* Image */}
                {item.image && (
                  <div className="mb-6 overflow-hidden rounded-2xl">
                    <img
                      src={item.image}
                      alt={item.title || "Post image"}
                      className="w-full max-h-96 object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}

                {/* Reactions */}
                <ReactionButtons
                  entityType="post"
                  entityId={item.id}
                  user={user}
                  authHeaders={authHeaders}
                />

                {/* Comments + Share row */}
                <div className="flex items-center justify-between pt-4 border-gray-100">
                  <div className="flex items-center gap-6">
                    {/* Comment */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center gap-2 text-sm font-semibold transition-all duration-300  -ml-2 px-4 py-2 rounded-full ${
                        openComments[key]
                          ? "bg-blue-50 text-blue-600 border border-blue-200"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                      }`}
                      onClick={() =>
                        setOpenComments((prev) => ({
                          ...prev,
                          [key]: !prev[key],
                        }))
                      }
                    >
                      {CommentIcon}
                      <span className="hidden sm:inline">Comments</span>
                    </motion.button>

                    {/* Share */}
                    <div
                      className="relative"
                      ref={(el) => (shareDropdownRefs.current[key] = el)}
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center gap-2 text-sm font-semibold transition-all duration-300 -ml-4 px-4 py-2 rounded-full ${
                          showShareDropdown[key]
                            ? "bg-green-50 text-green-600 border border-green-200"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                        }`}
                        onClick={() =>
                          setShowShareDropdown((prev) => ({
                            ...prev,
                            [key]: !prev[key],
                          }))
                        }
                      >
                        <FaShare className="text-sm" />
                        <span className="hidden sm:inline">Share</span>
                      </motion.button>

                      {showShareDropdown[key] && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute bottom-full left-0 mb-3 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-20 min-w-[200px]"
                        >
                          <div className="flex justify-center gap-4">
                            <motion.button
                              whileHover={{ scale: 1.15, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                shareToSocial("facebook", item);
                                setShowShareDropdown((p) => ({
                                  ...p,
                                  [key]: false,
                                }));
                              }}
                              className="p-3 hover:bg-blue-50 rounded-full transition-all duration-200"
                              title="Share to Facebook"
                            >
                              <FaFacebook className="text-blue-600 text-xl" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.15, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                shareToSocial("twitter", item);
                                setShowShareDropdown((p) => ({
                                  ...p,
                                  [key]: false,
                                }));
                              }}
                              className="p-3 hover:bg-gray-100 rounded-full transition-all duration-200"
                              title="Share to X"
                            >
                              <FaXTwitter className="text-gray-800 text-xl" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.15, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                shareToSocial("instagram", item);
                                setShowShareDropdown((p) => ({
                                  ...p,
                                  [key]: false,
                                }));
                              }}
                              className="p-3 hover:bg-pink-50 rounded-full transition-all duration-200"
                              title="Share to Instagram"
                            >
                              <FaInstagram className="text-pink-600 text-xl" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.15, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                shareToSocial("tiktok", item);
                                setShowShareDropdown((p) => ({
                                  ...p,
                                  [key]: false,
                                }));
                              }}
                              className="p-3 hover:bg-gray-100 rounded-full transition-all duration-200"
                              title="Share to TikTok"
                            >
                              <FaTiktok className="text-gray-800 text-xl" />
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {openComments[key] && (
                  <Comments
                    parentType="posts"
                    parentId={item.id}
                    user={user}
                    authHeaders={authHeaders}
                  />
                )}
              </>
            ) : (
              <>
                {/* Event body */}
                <div className="flex items-center mb-4 text-left">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full mr-3 flex items-center justify-center shadow-sm">
                    <span className="text-white font-semibold text-sm">
                      {authorInitial}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">{authorName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(
                        new Date(item.createdAt || item.updatedAt || Date.now())
                      )}{" "}
                      ago
                    </p>
                  </div>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-3 text-left tracking-tight">
                  {item.title}
                </h3>

                {item.description && (
                  <p className="text-gray-700 mb-4 leading-relaxed text-left">
                    {item.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  {item.dateFilter && (
                    <p className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">📅 Date:</span>
                      {new Date(item.dateFilter).toLocaleDateString()}
                    </p>
                  )}
                  {item.location && (
                    <p className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">📍 Location:</span>
                      {item.location}
                    </p>
                  )}
                </div>

                {item.photos?.filter(Boolean).map((url, i) => (
                  <div key={i} className="mb-6 overflow-hidden rounded-2xl">
                    <img
                      src={url}
                      alt={`Event photo ${i + 1}`}
                      className="w-full max-h-96 object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ))}

                <RSVPButtons
                  eventId={item.id}
                  user={user}
                  authHeaders={authHeaders}
                />
                <ReactionButtons
                  entityType="event"
                  entityId={item.id}
                  user={user}
                  authHeaders={authHeaders}
                />

                {/* Comments + Share row */}
                <div className="flex items-center justify-between pt-4 border-gray-100">
                  <div className="flex items-center gap-6">
                    {/* Comment */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center gap-2 text-sm font-semibold transition-all duration-300 -ml-4 px-4 py-2 rounded-full ${
                        openComments[key]
                          ? "bg-blue-50 text-blue-600 border border-blue-200"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                      }`}
                      onClick={() =>
                        setOpenComments((prev) => ({
                          ...prev,
                          [key]: !prev[key],
                        }))
                      }
                    >
                      {CommentIcon}
                      <span className="hidden sm:inline">Comments</span>
                    </motion.button>

                    {/* Share */}
                    <div
                      className="relative"
                      ref={(el) => (shareDropdownRefs.current[key] = el)}
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center gap-2 text-sm font-semibold transition-all duration-300 -ml-4 px-4 py-2 rounded-full ${
                          showShareDropdown[key]
                            ? "bg-green-50 text-green-600 border border-green-200"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                        }`}
                        onClick={() =>
                          setShowShareDropdown((prev) => ({
                            ...prev,
                            [key]: !prev[key],
                          }))
                        }
                      >
                        <FaShare className="text-sm" />
                        <span className="hidden sm:inline">Share</span>
                      </motion.button>

                      {showShareDropdown[key] && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute bottom-full left-0 mb-3 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-20 min-w-[200px]"
                        >
                          <div className="flex justify-center gap-4">
                            <motion.button
                              whileHover={{ scale: 1.15, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                shareToSocial("facebook", item);
                                setShowShareDropdown((p) => ({
                                  ...p,
                                  [key]: false,
                                }));
                              }}
                              className="p-3 hover:bg-blue-50 rounded-full transition-all duration-200"
                              title="Share to Facebook"
                            >
                              <FaFacebook className="text-blue-600 text-xl" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.15, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                shareToSocial("twitter", item);
                                setShowShareDropdown((p) => ({
                                  ...p,
                                  [key]: false,
                                }));
                              }}
                              className="p-3 hover:bg-gray-100 rounded-full transition-all duration-200"
                              title="Share to X"
                            >
                              <FaXTwitter className="text-gray-800 text-xl" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.15, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                shareToSocial("instagram", item);
                                setShowShareDropdown((p) => ({
                                  ...p,
                                  [key]: false,
                                }));
                              }}
                              className="p-3 hover:bg-pink-50 rounded-full transition-all duration-200"
                              title="Share to Instagram"
                            >
                              <FaInstagram className="text-pink-600 text-xl" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.15, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                shareToSocial("tiktok", item);
                                setShowShareDropdown((p) => ({
                                  ...p,
                                  [key]: false,
                                }));
                              }}
                              className="p-3 hover:bg-gray-100 rounded-full transition-all duration-200"
                              title="Share to TikTok"
                            >
                              <FaTiktok className="text-gray-800 text-xl" />
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Comments */}
                {openComments[key] && (
                  <Comments
                    parentType="events"
                    parentId={item.id}
                    user={user}
                    authHeaders={authHeaders}
                  />
                )}
              </>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}