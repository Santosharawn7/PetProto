// components/community/AllEvents.jsx
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ReactionButtons, Comments, RSVPButtons, EMOJIS } from '../../config/CommunityCommon'

export default function AllEvents(props) {
  const {
    user, posts, events, openComments, setOpenComments,
    showDropdown, setShowDropdown,
    showDeleteModal, setShowDeleteModal,
    handleEdit, handleDelete, dropdownRefs, isAuthor, authHeaders,
  } = props;

  const now = new Date();
  const visibleEvents = events.filter(ev => !ev.dateFilter || new Date(ev.dateFilter) >= now);
  const combined = [
    ...posts.map(p => ({ ...p, __type: 'post' })),
    ...visibleEvents.map(e => ({ ...e, __type: 'event' }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const CommentIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8-1.593 0-3.086-.308-4.405-.86L3 21l1.02-3.186C3.364 16.026 3 14.547 3 13c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );

  if (combined.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No posts or events yet</p>
      </div>
    );
  }

  return (
    <div>
      {combined.map(item => {
        const key = item.__type + '-' + item.id;
        return (
          <div 
            key={key}
            className="rounded-2xl border border-blue-100 dark:border-indigo-900 shadow-lg p-4 sm:p-6 mb-8
                       bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 transition relative"
          >
            {/* Dropdown menu */}
            {isAuthor(item) && (
              <div className="absolute top-4 right-4 z-10" ref={el => dropdownRefs.current[key] = el}>
                <button
                  onClick={() => setShowDropdown(prev => ({ ...prev, [key]: !prev[key] }))}
                  className="p-2 rounded-full hover:bg-gray-200"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="5" cy="12" r="2"/>
                    <circle cx="12" cy="12" r="2"/>
                    <circle cx="19" cy="12" r="2"/>
                  </svg>
                </button>
                {showDropdown[key] && (
                  <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                    <button
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => { setShowDropdown({}); handleEdit(item); }}
                    >
                      Edit
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                      onClick={() => { setShowDropdown({}); setShowDeleteModal(prev => ({ ...prev, [key]: true })); }}
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
                  <h3 className="font-semibold text-lg mb-3">Are you sure?</h3>
                  <p className="mb-4">This will permanently delete your {item.__type === 'post' ? 'post' : 'event'}.</p>
                  <div className="flex justify-end space-x-2">
                    <button
                      className="px-4 py-2 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400"
                      onClick={() => setShowDeleteModal(prev => ({ ...prev, [key]: false }))}
                    >
                      No
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                      onClick={() => handleDelete(item)}
                    >
                      Yes, Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* POST or EVENT BODY */}
            {item.__type === 'post' ? (
              <>
                <div className="flex items-center mb-4 text-left">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-blue-600 rounded-full mr-3 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {(item.authorName || 'User').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-200">{item.authorName || 'You'}</p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(item.createdAt))} ago
                    </p>
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold mb-3 text-blue-900 dark:text-blue-100 text-left tracking-tight">{item.title}</h3>
                {item.description && (
                  <p className="text-indigo-800 dark:text-indigo-200 mb-4 leading-relaxed text-left">{item.description}</p>
                )}
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full max-h-96 object-cover mb-4 mx-auto block rounded-xl shadow-md"
                  />
                )}
                <ReactionButtons entityType="post" entityId={item.id} user={user} authHeaders={authHeaders} />
                <button
                  className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mt-2 text-sm"
                  onClick={() =>
                    setOpenComments((prev) => ({
                      ...prev,
                      [key]: !prev[key],
                    }))
                  }
                >
                  {CommentIcon} Comments
                </button>
                {openComments[key] && (
                  <Comments parentType="posts" parentId={item.id} user={user} authHeaders={authHeaders} />
                )}
              </>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 text-left">
                  <h3 className="text-lg sm:text-xl font-extrabold text-blue-900 dark:text-blue-100 mb-2 sm:mb-0 tracking-tight">{item.title}</h3>
                  <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                    {formatDistanceToNow(new Date(item.createdAt))} ago
                  </span>
                </div>
                {item.description && (
                  <p className="text-indigo-800 dark:text-indigo-200 mb-4 leading-relaxed text-left">{item.description}</p>
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
                {item.photos?.filter(u => u).map((url, i) => (
                  <img 
                    key={i} 
                    src={url} 
                    alt={`Event photo ${i + 1}`}
                    className="w-full max-h-64 object-cover mb-4 mx-auto block rounded-xl shadow-md"
                  />
                ))}
                <RSVPButtons eventId={item.id} user={user} authHeaders={authHeaders} />
                <ReactionButtons entityType="event" entityId={item.id} user={user} authHeaders={authHeaders} />
                <button
                  className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mt-2 text-sm"
                  onClick={() =>
                    setOpenComments((prev) => ({
                      ...prev,
                      [key]: !prev[key],
                    }))
                  }
                >
                  {CommentIcon} Comments
                </button>
                {openComments[key] && (
                  <Comments parentType="events" parentId={item.id} user={user} authHeaders={authHeaders} />
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
