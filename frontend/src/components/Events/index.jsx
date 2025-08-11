// components/community/Events.jsx
import React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ReactionButtons,
  Comments,
  RSVPButtons,
} from "../../config/CommunityCommon";
import { FaShare } from "react-icons/fa";

export default function EventsTab(props) {
  const {
    user,
    events,
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

  const now = new Date();
  const visibleEvents = events.filter(
    (ev) => !ev.dateFilter || new Date(ev.dateFilter) >= now
  );

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
      <button
        className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
      {showEventForm && (
        <form
          onSubmit={handleCreateEvent}
          className="rounded-2xl border border-blue-100 dark:border-indigo-900 shadow-lg p-6 mb-8 text-left
                     bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900"
        >
          <h3 className="font-semibold text-lg text-blue-900 dark:text-blue-100">
            {isEdit ? "Edit Event" : "Create New Event"}
          </h3>
          <input
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            placeholder="Event description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <input
            type="date"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          <input
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Event location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Event Photos
            </label>
            {photos.map((url, i) => (
              <input
                key={i}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              + Add another photo
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
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
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {/* Events List */}
      {visibleEvents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No events yet. Create the first one!</p>
        </div>
      ) : (
        visibleEvents.map((ev) => {
          const key = "event-" + ev.id;
          return (
            <div
              key={key}
              className="rounded-2xl border border-blue-100 dark:border-indigo-900 shadow-lg p-4 sm:p-6 mb-8 text-left
                                      bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 relative"
            >
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
                    className="p-2 rounded-full hover:bg-gray-200"
                  >
                    <svg
                      className="w-6 h-6 text-gray-500"
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
                    <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                      <button
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setShowDropdown({});
                          handleEdit({ ...ev, __type: "event" });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
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
                  <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full relative">
                    <h3 className="font-semibold text-lg mb-3">
                      Are you sure?
                    </h3>
                    <p className="mb-4">
                      This will permanently delete your event.
                    </p>
                    <div className="flex justify-end space-x-2">
                      <button
                        className="px-4 py-2 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400"
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
                        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                        onClick={() => handleDelete({ ...ev, __type: "event" })}
                      >
                        Yes, Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 text-left">
                <h3 className="text-lg sm:text-xl font-extrabold text-blue-900 dark:text-blue-100 mb-2 sm:mb-0 tracking-tight">
                  {ev.title}
                </h3>
                <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                  {formatDistanceToNow(new Date(ev.createdAt))} ago
                </span>
              </div>
              {ev.description && (
                <p className="text-indigo-800 dark:text-indigo-200 mb-4 leading-relaxed text-left">
                  {ev.description}
                </p>
              )}
              <div className="space-y-2 mb-4">
                {ev.dateFilter && (
                  <p className="flex items-center text-sm text-gray-600">
                    <span className="font-medium mr-2">📅 Date:</span>
                    {new Date(ev.dateFilter).toLocaleDateString()}
                  </p>
                )}
                {ev.location && (
                  <p className="flex items-center text-sm text-gray-600">
                    <span className="font-medium mr-2">📍 Location:</span>
                    {ev.location}
                  </p>
                )}
              </div>
              {ev.photos
                ?.filter((u) => u)
                .map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Event photo ${i + 1}`}
                    className="w-full max-h-64 object-cover mb-4 mx-auto block rounded-xl shadow-md"
                  />
                ))}
              <RSVPButtons
                eventId={ev.id}
                user={user}
                authHeaders={authHeaders}
              />
              <ReactionButtons
                entityType="event"
                entityId={ev.id}
                user={user}
                authHeaders={authHeaders}
              />
              <div className="flex items-center gap-4 mt-4">
                {/* Comment Button */}
                <button
                  className="flex items-center gap-2 text-gray-500 hover:text-blue-600 text-sm"
                  onClick={() =>
                    setOpenComments((prev) => ({
                      ...prev,
                      [key]: !prev[key],
                    }))
                  }
                >
                  {CommentIcon} Comments
                </button>

                {/* Share Button */}

                <button
                  className="flex items-center gap-2 text-gray-500 hover:text-green-600 text-sm"
                  onClick={() => {
                    const shareData = {
                      title: p.title || "Check out this post!",
                      text: p.description || "",
                      url: `${window.location.origin}?post=${p.id}`,
                    };

                    // If post has an image and browser supports file sharing
                    if (
                      p.image &&
                      navigator.canShare &&
                      navigator.canShare({ files: [] })
                    ) {
                      fetch(p.image)
                        .then((res) => res.blob())
                        .then((blob) => {
                          const file = new File([blob], "post-image.jpg", {
                            type: blob.type,
                          });
                          shareData.files = [file];
                          return navigator.share(shareData);
                        })
                        .catch((err) =>
                          console.error("Error sharing image:", err)
                        );
                    } else if (navigator.share) {
                      navigator
                        .share(shareData)
                        .catch((err) => console.error("Error sharing:", err));
                    } else {
                      navigator.clipboard.writeText(shareData.url);
                      alert("Post link copied to clipboard!");
                    }
                  }}
                >
                  <FaShare /> Share
                </button>
              </div>
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
