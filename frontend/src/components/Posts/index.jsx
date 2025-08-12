// components/community/Posts.jsx
import React, { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ReactionButtons, Comments } from "../../config/CommunityCommon";
import { FaShare, FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

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

  // Social media share (mirrors Events.jsx)
  const shareToSocial = (platform, post) => {
    const postUrl = `${window.location.origin}?post=${post.id}`;
    const postText = `Check out this post: ${post.title || "Awesome Post"}`;
    const postDescription = post.description ? ` - ${post.description}` : "";

    let shareUrl = "";

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          postUrl
        )}&quote=${encodeURIComponent(postText + postDescription)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          postText + postDescription
        )}&url=${encodeURIComponent(postUrl)}`;
        break;
      case "instagram":
        navigator.clipboard.writeText(
          postUrl + "\n\n" + postText + postDescription
        );
        alert(
          "Post details copied to clipboard! You can now paste this in your Instagram story or post."
        );
        return;
      case "tiktok":
        navigator.clipboard.writeText(
          postUrl + "\n\n" + postText + postDescription
        );
        alert(
          "Post details copied to clipboard! You can now share this in your TikTok video description."
        );
        return;
      default:
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
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
      {/* Create/Edit toggle (restyled to match Events) */}
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
          <h3 className="font-semibold text-lg text-gray-800 dark:text-white">
            {isEdit ? "Edit Post" : "Create New Post"}
          </h3>
          <input
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mt-3 dark:bg-gray-700 dark:text-white placeholder:text-white/70 dark:placeholder:text-white/70"
            placeholder="Post title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />
          <textarea
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none mt-3 dark:bg-gray-700 dark:text-white placeholder:text-white/70 dark:placeholder:text-white/70"
            rows={4}
            placeholder="What's on your mind?"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <input
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mt-3 dark:bg-gray-700 dark:text-white placeholder:text-white/70 dark:placeholder:text-white/70"
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
          <p className="text-gray-500 dark:text-gray-400">No posts yet. Create the first one!</p>
        </div>
      ) : (
        posts.map((p) => {
          const key = "post-" + p.id;
          const authorInitial = (p.authorName || "User").charAt(0).toUpperCase();

          return (
            <div
              key={key}
              className="rounded-2xl border border-orange-300/50 dark:border-purple-700/50 shadow-xl p-4 sm:p-6 mb-8 text-left relative backdrop-blur-sm"
              style={{
                background:
                  "linear-gradient(135deg, rgba(120, 53, 15, 0.9) 0%, rgba(88, 28, 135, 0.95) 100%)",
              }}
            >
              {/* Author controls */}
              {isAuthor(p) && (
                <div
                  className="absolute top-4 right-4 z-10"
                  ref={(el) => (dropdownRefs.current[key] = el)}
                >
                  <button
                    onClick={() =>
                      setShowDropdown((prev) => ({ ...prev, [key]: !prev[key] }))
                    }
                    className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
                    aria-label="More actions"
                  >
                    <svg
                      className="w-6 h-6 text-white"
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
                    <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20">
                      <button
                        className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                        onClick={() => {
                          setShowDropdown({});
                          handleEdit({ ...p, __type: "post" });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                        onClick={() => {
                          setShowDropdown({});
                          setShowDeleteModal((prev) => ({ ...prev, [key]: true }));
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
                    <h3 className="font-semibold text-lg mb-3 text-gray-800 dark:text-white">
                      Are you sure?
                    </h3>
                    <p className="mb-4 text-gray-600 dark:text-gray-300">
                      This will permanently delete your post.
                    </p>
                    <div className="flex justify-end space-x-2">
                      <button
                        className="px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200"
                        onClick={() =>
                          setShowDeleteModal((prev) => ({ ...prev, [key]: false }))
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

              {/* Author block (glass + white) */}
              <div className="flex items-center mb-4 text-left">
                <div className="w-10 h-10 bg-gradient-to-r from-white/30 to_white/50 backdrop-blur-sm rounded-full mr-3 flex items-center justify-center border border-white/20">
                  <span className="text-white font-medium text-sm">{authorInitial}</span>
                </div>
                <div>
                  <p className="font-semibold text-white">{p.authorName || "You"}</p>
                  <p className="text-xs text-white/80">
                    {formatDistanceToNow(new Date(p.createdAt))} ago
                  </p>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg sm:text-xl font-extrabold text-white mb-3 text-left tracking-tight drop-shadow-sm">
                {p.title}
              </h3>

              {/* Image */}
              {p.image && (
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-full max-h-96 object-cover mb-4 mx-auto block rounded-xl shadow-lg border border-white/20"
                />
              )}

              {/* Description */}
              {p.description && (
                <p className="text-white/90 mb-4 leading-relaxed text-left">{p.description}</p>
              )}

              {/* Reactions */}
              <ReactionButtons
                entityType="post"
                entityId={p.id}
                user={user}
                authHeaders={authHeaders}
              />

              {/* Comments + Share row */}
              <div className="flex items-center gap-4 mt-4">
                {/* Comment Button */}
                <button
                  className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors duration-200"
                  onClick={() =>
                    setOpenComments((prev) => ({ ...prev, [key]: !prev[key] }))
                  }
                >
                  {CommentIcon} Comments
                </button>

                {/* Enhanced Share (same as Events) */}
                <div
                  className="relative"
                  ref={(el) => (shareDropdownRefs.current[key] = el)}
                >
                  <button
                    className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors duration-200"
                    onClick={() =>
                      setShowShareDropdown((prev) => ({
                        ...prev,
                        [key]: !prev[key],
                      }))
                    }
                  >
                    <FaShare /> Share
                  </button>

                  {showShareDropdown[key] && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 p-3 z-20 min-w-[160px] backdrop-blur-sm">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => {
                            shareToSocial("facebook", p);
                            setShowShareDropdown((prev) => ({
                              ...prev,
                              [key]: false,
                            }));
                          }}
                          className="p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Share to Facebook"
                        >
                          <FaFacebook className="text-blue-600 text-xl" />
                        </button>
                        <button
                          onClick={() => {
                            shareToSocial("twitter", p);
                            setShowShareDropdown((prev) => ({
                              ...prev,
                              [key]: false,
                            }));
                          }}
                          className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Share to X"
                        >
                          <FaXTwitter className="text-gray-800 dark:text-white text-xl" />
                        </button>
                        <button
                          onClick={() => {
                            shareToSocial("instagram", p);
                            setShowShareDropdown((prev) => ({
                              ...prev,
                              [key]: false,
                            }));
                          }}
                          className="p-3 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Share to Instagram"
                        >
                          <FaInstagram className="text-pink-600 text-xl" />
                        </button>
                        <button
                          onClick={() => {
                            shareToSocial("tiktok", p);
                            setShowShareDropdown((prev) => ({
                              ...prev,
                              [key]: false,
                            }));
                          }}
                          className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Share to TikTok"
                        >
                          <FaTiktok className="text-gray-800 dark:text-white text-xl" />
                        </button>
                      </div>
                    </div>
                  )}
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
            </div>
          );
        })
      )}
    </div>
  );
}
