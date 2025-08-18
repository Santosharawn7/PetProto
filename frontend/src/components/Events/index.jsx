// components/community/Events.jsx
import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ReactionButtons,
  Comments,
  RSVPButtons,
} from "../../config/CommunityCommon";
import { FaShare, FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

export default function EventsTab(props) {
  const {
    user,
    events = [],
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
    showEventForm,
    setShowEventForm,
    isEdit,
    setIsEdit,
    setEditItem,
    title,
    setTitle,
    desc,
    setDesc,
    dateFilter,
    setDateFilter,
    location,
    setLocation,
    photos,
    setPhotos,
    handleCreateEvent,
    authHeaders,
  } = props;

  // State for share dropdown
  const [showShareDropdown, setShowShareDropdown] = useState({});

  // Ensure ref object exists
  if (dropdownRefs && !dropdownRefs.current) dropdownRefs.current = {};

  // Helpers for author display
  const getAuthorName = (ev) =>
    ev?.authorName ||
    ev?.author?.displayName ||
    ev?.author?.name ||
    ev?.user?.displayName ||
    ev?.user?.name ||
    ev?.createdBy?.name ||
    ev?.createdByUsername ||
    (isAuthor(ev) ? "You" : "User");

  const getAuthorInitial = (name) =>
    (name || "U").trim().charAt(0).toUpperCase() || "U";

  // Only show events today+ (original logic kept)
  const now = new Date();
  const visibleEvents = events.filter(
    (ev) => !ev.dateFilter || new Date(ev.dateFilter) >= now
  );

  // Social share: FB/Twitter compose, IG/TikTok = copy text + open site in popup
  const shareToSocial = async (platform, event) => {
    const eventUrl = `${window.location.origin}?event=${event.id}`;
    const eventText = `Check out this event: ${event.title || "Awesome Event"}`;
    const eventDescription = event.description ? ` - ${event.description}` : "";

    const combined = `${eventText}${eventDescription}\n\n${eventUrl}`;
    let shareUrl = "";
    let popupUrl = "";
    const popupFeatures = "width=600,height=640";

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          eventUrl
        )}&quote=${encodeURIComponent(eventText + eventDescription)}`;
        window.open(shareUrl, "_blank", popupFeatures);
        return;

      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          eventText + eventDescription
        )}&url=${encodeURIComponent(eventUrl)}`;
        window.open(shareUrl, "_blank", popupFeatures);
        return;

      case "instagram":
        try {
          await navigator.clipboard.writeText(combined);
        } catch {}
        // No official web share compose; open site so user can paste
        popupUrl = "https://www.instagram.com/";
        window.open(popupUrl, "_blank", popupFeatures);
        return;

      case "tiktok":
        try {
          await navigator.clipboard.writeText(combined);
        } catch {}
        // TikTok web upload exists; open so user can paste in description
        popupUrl = "https://www.tiktok.com/upload?lang=en";
        window.open(popupUrl, "_blank", popupFeatures);
        return;

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
          setShowEventForm((f) => !f);
          setIsEdit(false);
          setEditItem(null);
          setTitle("");
          setDesc("");
          setDateFilter("");
          setLocation("");
          setPhotos([""]);
        }}
      >
        {showEventForm
          ? isEdit
            ? "Cancel Edit"
            : "Cancel"
          : isEdit
          ? "Edit Event"
          : "Create New Event"}
      </button>

      {/* Event form */}
      {showEventForm && (
        <form
          onSubmit={handleCreateEvent}
          className="rounded-2xl border border-orange-200 dark:border-purple-800 shadow-xl p-6 mb-8 text-left bg-gradient-to-br from-orange-100 to-purple-100 dark:from-gray-800 dark:to-gray-900"
        >
          <h3 className="font-semibold text-lg text-gray-800 dark:text-white">
            {isEdit ? "Edit Event" : "Create New Event"}
          </h3>

          <input
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mt-3 dark:bg-gray-700 dark:text-white placeholder:text-white/70 dark:placeholder:text-white/70"
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <textarea
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none mt-3 dark:bg-gray-700 dark:text-white placeholder:text-white/70 dark:placeholder:text-white/70"
            rows={3}
            placeholder="Event description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />

          <input
            type="date"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mt-3 dark:bg-gray-700 dark:text-white placeholder:text-white/70 dark:placeholder:text-white/70"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />

          <input
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mt-3 dark:bg-gray-700 dark:text-white placeholder:text-white/70 dark:placeholder:text-white/70"
            placeholder="Event location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <div className="space-y-2 mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Event Photos
            </label>
            {photos.map((url, i) => (
              <input
                key={i}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder:text-white/70 dark:placeholder:text-white/70"
                placeholder="Photo URL"
                value={url}
                onChange={(e) => {
                  const newPhotos = [...photos];
                  newPhotos[i] = e.target.value;
                  setPhotos(newPhotos);
                }}
              />
            ))}
            <button
              type="button"
              onClick={() => setPhotos((prev) => [...prev, ""])}
              className="text-sm text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 font-medium"
            >
              + Add another photo
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium shadow-lg"
            >
              {isEdit ? "Update Event" : "Create Event"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowEventForm(false);
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

      {/* Events List */}
      {visibleEvents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No events yet. Create the first one!
          </p>
        </div>
      ) : (
        visibleEvents.map((ev) => {
          const key = "event-" + ev.id;
          const authorName = getAuthorName(ev);
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
              {/* Author controls */}
              {isAuthor(ev) && (
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
                          handleEdit({ ...ev, __type: "event" });
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
                      This will permanently delete your event.
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
                        onClick={() => handleDelete({ ...ev, __type: "event" })}
                      >
                        Yes, Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Author block */}
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
                      new Date(ev.createdAt || ev.updatedAt || Date.now())
                    )}{" "}
                    ago
                  </p>
                </div>
              </div>

              {/* Title */}
              {ev.title && (
                <h3 className="text-lg sm:text-xl font-extrabold text-white mb-3 text-left tracking-tight drop-shadow-sm">
                  {ev.title}
                </h3>
              )}

              {/* Description */}
              {ev.description && (
                <p className="text-white/90 mb-4 leading-relaxed text-left">
                  {ev.description}
                </p>
              )}

              {/* Meta */}
              <div className="space-y-2 mb-4">
                {ev.dateFilter && (
                  <p className="flex items-center text-sm text-white/80">
                    <span className="font-medium mr-2">📅 Date:</span>
                    {new Date(ev.dateFilter).toLocaleDateString()}
                  </p>
                )}
                {ev.location && (
                  <p className="flex items-center text-sm text-white/80">
                    <span className="font-medium mr-2">📍 Location:</span>
                    {ev.location}
                  </p>
                )}
              </div>

              {/* Photos */}
              {ev.photos?.filter(Boolean).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Event photo ${i + 1}`}
                  className="w-full max-h-64 object-cover mb-4 mx-auto block rounded-xl shadow-lg border border-white/20"
                />
              ))}

              {/* Actions */}
              <RSVPButtons eventId={ev.id} user={user} authHeaders={authHeaders} />
              <ReactionButtons
                entityType="event"
                entityId={ev.id}
                user={user}
                authHeaders={authHeaders}
              />

              {/* Comments + Share (mobile: icons only; desktop: icon+label) */}
              <div className="flex items-center gap-4 mt-4">
                {/* Comment */}
                <button
                  className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors duration-200"
                  onClick={() =>
                    setOpenComments((prev) => ({ ...prev, [key]: !prev[key] }))
                  }
                >
                  {/* mobile */}
                  <span className="sm:hidden">{CommentIcon}</span>
                  {/* desktop */}
                  <span className="hidden sm:flex items-center gap-2">
                    {CommentIcon} Comments
                  </span>
                </button>

                {/* Share */}
                <div className="relative">
                  <button
                    className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors duration-200"
                    onClick={() =>
                      setShowShareDropdown((prev) => ({
                        ...prev,
                        [key]: !prev[key],
                      }))
                    }
                  >
                    {/* mobile */}
                    <span className="sm:hidden">
                      <FaShare />
                    </span>
                    {/* desktop */}
                    <span className="hidden sm:flex items-center gap-2">
                      <FaShare /> Share
                    </span>
                  </button>

                  {/* Share Dropdown */}
                  {showShareDropdown[key] && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 p-3 z-20 min-w-[160px] backdrop-blur-sm">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => {
                            shareToSocial("facebook", ev);
                            setShowShareDropdown({});
                          }}
                          className="p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Share to Facebook"
                        >
                          <FaFacebook className="text-blue-600 text-xl" />
                        </button>
                        <button
                          onClick={() => {
                            shareToSocial("twitter", ev);
                            setShowShareDropdown({});
                          }}
                          className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Share to X"
                        >
                          <FaXTwitter className="text-gray-800 dark:text-white text-xl" />
                        </button>
                        <button
                          onClick={() => {
                            shareToSocial("instagram", ev);
                            setShowShareDropdown({});
                          }}
                          className="p-3 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Share to Instagram"
                        >
                          <FaInstagram className="text-pink-600 text-xl" />
                        </button>
                        <button
                          onClick={() => {
                            shareToSocial("tiktok", ev);
                            setShowShareDropdown({});
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
                  parentId={ev.id}
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