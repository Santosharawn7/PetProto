// components/community/Posts.jsx
import React, { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ReactionButtons, Comments } from "../../config/CommunityCommon";
import { FaShare, FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { motion } from "framer-motion";

export default function PostsTab(props) {
  const {
    user,
    posts = [],
    openComments,
    setOpenComments,
    showDropdown,
    setShowDropdown,
    showDeleteModal,
    setShowDeleteModal,
    isAuthor,
    handleEdit,
    handleDelete,
    dropdownRefs,
    showPostForm,
    setShowPostForm,
    isEdit,
    setIsEdit,
    setEditItem,
    newTitle,
    setNewTitle,
    newDesc,
    setNewDesc,
    newImage,
    setNewImage,
    handleCreatePost,
    authHeaders,
  } = props;

  // share dropdown state + refs (per post)
  const [showShareDropdown, setShowShareDropdown] = useState({});
  const shareDropdownRefs = useRef({});
  if (dropdownRefs && !dropdownRefs.current) dropdownRefs.current = {};
  if (!shareDropdownRefs.current) shareDropdownRefs.current = {};

  useEffect(() => {
    const handleClickOutside = (e) => {
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showShareDropdown]);

  // Social media share (FB/Twitter popups; IG/TikTok copy + open site)
  const shareToSocial = async (platform, post) => {
    const postUrl = `${window.location.origin}?post=${post.id}`;
    const text = `Check out this post: ${post.title || "Awesome Post"}`;
    const desc = post.description ? ` - ${post.description}` : "";
    const combined = `${text}${desc}\n\n${postUrl}`;
    const popup = "width=600,height=640";

    switch (platform) {
      case "facebook": {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          postUrl
        )}&quote=${encodeURIComponent(text + desc)}`;
        window.open(url, "_blank", popup);
        return;
      }
      case "twitter": {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          text + desc
        )}&url=${encodeURIComponent(postUrl)}`;
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
        // Opening TikTok upload page so user can paste into caption
        window.open("https://www.tiktok.com/upload?lang=en", "_blank", popup);
        return;
      }
      default:
        return;
    }
  };

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

  return (
    <div className="space-y-8">
      {/* Create/Edit toggle */}
      <button
        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-lg hover:from-orange-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg"
        onClick={() => {
          setShowPostForm((f) => !f);
          setIsEdit(false);
          setEditItem(null);
          setNewTitle("");
          setNewDesc("");
          setNewImage("");
        }}
      >
        {showPostForm
          ? isEdit
            ? "Cancel Edit"
            : "Cancel"
          : isEdit
          ? "Edit Post"
          : "Create New Post"}
      </button>

      {showPostForm && (
        <form
          onSubmit={handleCreatePost}
          className="rounded-2xl border border-orange-200 dark:border-purple-800 shadow-xl p-6 mb-8 text-left bg-gradient-to-br from-orange-100 to-purple-100 dark:from-gray-800 dark:to-gray-900"
        >
          <h3 className="font-semibold text-lg text-black dark:text-white">
            {isEdit ? "Edit Post" : "Create New Post"}
          </h3>
          <input
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mt-3 dark:bg-gray-700 text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/70"
            placeholder="Post title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />
          <textarea
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none mt-3 dark:bg-gray-700 text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/70"
            rows={4}
            placeholder="What's on your mind?"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <input
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mt-3 dark:bg-gray-700 text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/70"
            placeholder="Image URL (optional)"
            value={newImage}
            onChange={(e) => setNewImage(e.target.value)}
          />
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium shadow-lg"
            >
              {isEdit ? "Update Post" : "Publish Post"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPostForm(false);
                setIsEdit(false);
                setEditItem(null);
              }}
              className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-medium shadow-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No posts yet. Create the first one!
          </p>
        </div>
      ) : (
        posts.map((p, index) => {
          const key = "post-" + p.id;
          const authorInitial = (p.authorName || "User")
            .charAt(0)
            .toUpperCase();

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
              {/* Author actions */}
              {isAuthor(p) && (
                <div
                  className="absolute top-4 right-4 z-10"
                  ref={(el) => (dropdownRefs.current[key] = el)}
                >
                  <button
                    onClick={() =>
                      setShowDropdown((prev) => ({
                        ...prev,
                        [key]: !prev[key],
                      }))
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
                    <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg z-20">
                      <button
                        className="w-full text-left px-4 py-2 text-black hover:bg-gray-200 rounded-t-lg transition-all duration-200"
                        onClick={() => {
                          setShowDropdown({});
                          handleEdit({ ...p, __type: "post" });
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
                      This will permanently delete your post.
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
                        onClick={() => handleDelete({ ...p, __type: "post" })}
                      >
                        Yes, Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Author block */}
              <div className="flex items-center mb-4 text-left">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full mr-3 flex items-center justify-center shadow-sm">
                  <span className="text-white font-semibold text-sm">
                    {authorInitial}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">
                    {p.authorName || "You"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(p.createdAt))} ago
                  </p>
                </div>
              </div>

              {/* Title */}
              {p.title && (
                <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-3 text-left tracking-tight">
                  {p.title}
                </h3>
              )}

              {/* Image */}
              {p.image && (
                <div className="mb-6 overflow-hidden rounded-2xl">
                  <img
                    src={p.image}
                    alt={p.title || "Post image"}
                    className="w-full max-h-96 object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}

              {/* Description */}
              {p.description && (
                <p className="text-gray-700 mb-4 leading-relaxed text-left">
                  {p.description}
                </p>
              )}

              {/* Reactions */}
              <ReactionButtons
                entityType="post"
                entityId={p.id}
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
                    className={`flex items-start gap-2 text-sm font-semibold transition-all duration-300 -ml-2 px-4 py-2 rounded-full ${
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
                              shareToSocial("facebook", p);
                              setShowShareDropdown((prev) => ({
                                ...prev,
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
                              shareToSocial("twitter", p);
                              setShowShareDropdown((prev) => ({
                                ...prev,
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
                              shareToSocial("instagram", p);
                              setShowShareDropdown((prev) => ({
                                ...prev,
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
                              shareToSocial("tiktok", p);
                              setShowShareDropdown((prev) => ({
                                ...prev,
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
                  parentType="posts"
                  parentId={p.id}
                  user={user}
                  authHeaders={authHeaders}
                />
              )}
            </motion.div>
          );
        })
      )}
    </div>
  );
}