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

  // Share dropdown state/refs (match Events.jsx behavior)
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

  // Reusable author helpers (same as Events.jsx behavior)
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

  // Filter out past events (same as Events.jsx logic)
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

  // Social share (identical behavior to Events.jsx)
  const shareToSocial = (platform, item) => {
    const isEvent = item.__type === "event";
    const itemUrl = `${window.location.origin}?${isEvent ? "event" : "post"}=${item.id}`;
    const baseText = isEvent ? "Check out this event: " : "Check out this post: ";
    const itemText = `${baseText}${item.title || (isEvent ? "Awesome Event" : "Great Post")}`;
    const itemDescription = item.description ? ` - ${item.description}` : "";

    let shareUrl = "";

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          itemUrl
        )}&quote=${encodeURIComponent(itemText + itemDescription)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          itemText + itemDescription
        )}&url=${encodeURIComponent(itemUrl)}`;
        break;
      case "instagram":
        navigator.clipboard.writeText(itemUrl + "\n\n" + itemText + itemDescription);
        alert(
          "Details copied to clipboard! You can now paste this in your Instagram story or post."
        );
        return;
      case "tiktok":
        navigator.clipboard.writeText(itemUrl + "\n\n" + itemText + itemDescription);
        alert(
          "Details copied to clipboard! You can now paste this in your TikTok video description."
        );
        return;
      default:
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  if (combined.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No posts or events yet</p>
      </div>
    );
  }

  return (
    <div>
      {combined.map((item) => {
        const key = item.__type + "-" + item.id;
        const authorName = getAuthorName(item);
        const authorInitial = getAuthorInitial(authorName);

        return (
          <div
            key={key}
            className="rounded-2xl border border-orange-300/50 dark:border-purple-700/50 shadow-xl p-4 sm:p-6 mb-8 text-left relative backdrop-blur-sm"
            style={{
              background:
                "linear-gradient(135deg, rgba(120, 53, 15, 0.9) 0%, rgba(88, 28, 135, 0.95) 100%)",
            }}
          >
            {/* Dropdown menu (author controls) */}
            {isAuthor(item) && (
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
                        handleEdit(item);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
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
                  <h3 className="font-semibold text-lg mb-3 text-gray-800 dark:text-white">
                    Are you sure?
                  </h3>
                  <p className="mb-4 text-gray-600 dark:text-gray-300">
                    This will permanently delete your{" "}
                    {item.__type === "post" ? "post" : "event"}.
                  </p>
                  <div className="flex justify-end space-x-2">
                    <button
                      className="px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200"
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

            {/* POST or EVENT BODY */}
            {item.__type === "post" ? (
              <>
                {/* Author block (match Events look) */}
                <div className="flex items-center mb-4 text-left">
                  <div className="w-10 h-10 bg-gradient-to-r from-white/30 to-white/50 backdrop-blur-sm rounded-full mr-3 flex items-center justify-center border border-white/20">
                    <span className="text-white font-medium text-sm">
                      {authorInitial}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{authorName}</p>
                    <p className="text-xs text-white/80">
                      {formatDistanceToNow(new Date(item.createdAt))} ago
                    </p>
                  </div>
                </div>

                <h3 className="text-lg sm:text-xl font-extrabold mb-3 text-white text-left tracking-tight drop-shadow-sm">
                  {item.title}
                </h3>

                {item.description && (
                  <p className="text-white/90 mb-4 leading-relaxed text-left">
                    {item.description}
                  </p>
                )}

                {item.image && (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full max-h-96 object-cover mb-4 mx-auto block rounded-xl shadow-lg border border-white/20"
                  />
                )}

                <ReactionButtons
                  entityType="post"
                  entityId={item.id}
                  user={user}
                  authHeaders={authHeaders}
                />

                <div className="flex items-center gap-4 mt-4">
                  {/* Comment Button */}
                  <button
                    className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors duration-200"
                    onClick={() =>
                      setOpenComments((prev) => ({
                        ...prev,
                        [key]: !prev[key],
                      }))
                    }
                  >
                    {CommentIcon} Comments
                  </button>

                  {/* Share Button (social dropdown) */}
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
                              shareToSocial("facebook", item);
                              setShowShareDropdown((p) => ({
                                ...p,
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
                              shareToSocial("twitter", item);
                              setShowShareDropdown((p) => ({
                                ...p,
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
                              shareToSocial("instagram", item);
                              setShowShareDropdown((p) => ({
                                ...p,
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
                              shareToSocial("tiktok", item);
                              setShowShareDropdown((p) => ({
                                ...p,
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
                {/* Event body (match Events.jsx) */}
                <div className="flex items-center mb-4 text-left">
                  <div className="w-10 h-10 bg-gradient-to-r from-white/30 to-white/50 backdrop-blur-sm rounded-full mr-3 flex items-center justify-center border border-white/20">
                    <span className="text-white font-medium text-sm">
                      {authorInitial}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{authorName}</p>
                    <p className="text-xs text-white/80">
                      {formatDistanceToNow(
                        new Date(item.createdAt || item.updatedAt || Date.now())
                      )}{" "}
                      ago
                    </p>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg sm:text-xl font-extrabold text-white mb-3 text-left tracking-tight drop-shadow-sm">
                  {item.title}
                </h3>

                {/* Description */}
                {item.description && (
                  <p className="text-white/90 mb-4 leading-relaxed text-left">
                    {item.description}
                  </p>
                )}

                {/* Meta */}
                <div className="space-y-2 mb-4">
                  {item.dateFilter && (
                    <p className="flex items-center text-sm text-white/80">
                      <span className="font-medium mr-2">📅 Date:</span>
                      {new Date(item.dateFilter).toLocaleDateString()}
                    </p>
                  )}
                  {item.location && (
                    <p className="flex items-center text-sm text-white/80">
                      <span className="font-medium mr-2">📍 Location:</span>
                      {item.location}
                    </p>
                  )}
                </div>

                {/* Photos */}
                {item.photos?.filter(Boolean).map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Event photo ${i + 1}`}
                    className="w-full max-h-64 object-cover mb-4 mx-auto block rounded-xl shadow-lg border border-white/20"
                  />
                ))}

                {/* Actions */}
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

                <div className="flex items-center gap-4 mt-4">
                  {/* Comment Button */}
                  <button
                    className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors duration-200"
                    onClick={() =>
                      setOpenComments((prev) => ({
                        ...prev,
                        [key]: !prev[key],
                      }))
                    }
                  >
                    {CommentIcon} Comments
                  </button>

                  {/* Share Button (same dropdown as Events.jsx) */}
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
                              shareToSocial("facebook", item);
                              setShowShareDropdown((p) => ({
                                ...p,
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
                              shareToSocial("twitter", item);
                              setShowShareDropdown((p) => ({
                                ...p,
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
                              shareToSocial("instagram", item);
                              setShowShareDropdown((p) => ({
                                ...p,
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
                              shareToSocial("tiktok", item);
                              setShowShareDropdown((p) => ({
                                ...p,
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
                    parentType="events"
                    parentId={item.id}
                    user={user}
                    authHeaders={authHeaders}
                  />
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
