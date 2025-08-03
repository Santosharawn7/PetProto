// components/community/Posts.jsx
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ReactionButtons, Comments, EMOJIS } from '../../config/CommunityCommon';

export default function PostsTab(props) {
  const {
    user, posts, openComments, setOpenComments,
    showDropdown, setShowDropdown, showDeleteModal, setShowDeleteModal,
    isAuthor, handleEdit, handleDelete, dropdownRefs,
    showPostForm, setShowPostForm, isEdit, setIsEdit, setEditItem,
    newTitle, setNewTitle, newDesc, setNewDesc, newImage, setNewImage, handleCreatePost,
    authHeaders
  } = props;

  const CommentIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8-1.593 0-3.086-.308-4.405-.86L3 21l1.02-3.186C3.364 16.026 3 14.547 3 13c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );

  return (
    <div className="space-y-8">
      <button
        className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        onClick={() => {
          setShowPostForm(f => !f);
          setIsEdit(false);
          setEditItem(null);
          setNewTitle(''); setNewDesc(''); setNewImage('');
        }}
      >
        {showPostForm ? (isEdit ? "Cancel Edit" : "Cancel") : (isEdit ? "Edit Post" : "Create New Post")}
      </button>
      {showPostForm && (
        <form 
          onSubmit={handleCreatePost}
          className="rounded-2xl border border-blue-100 dark:border-indigo-900 shadow-lg p-6 mb-8 text-left
                     bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900"
        >
          <h3 className="font-semibold text-lg text-blue-900 dark:text-blue-100">
            {isEdit ? "Edit Post" : "Create New Post"}
          </h3>
          <input
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Post title"
            value={newTitle} 
            onChange={e => setNewTitle(e.target.value)}
            required
          />
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
            placeholder="What's on your mind?"
            value={newDesc} 
            onChange={e => setNewDesc(e.target.value)}
          />
          <input
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Image URL (optional)"
            value={newImage} 
            onChange={e => setNewImage(e.target.value)}
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              type="submit"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              {isEdit ? "Update Post" : "Publish Post"}
            </button>
            <button 
              type="button"
              onClick={() => { setShowPostForm(false); setIsEdit(false); setEditItem(null); }}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No posts yet. Create the first one!</p>
        </div>
      ) : (
        posts.map(p => {
          const key = 'post-' + p.id;
          return (
            <div key={key} className="rounded-2xl border border-blue-100 dark:border-indigo-900 shadow-lg p-4 sm:p-6 mb-8 text-left
                                      bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 relative">
              {isAuthor(p) && (
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
                        onClick={() => { setShowDropdown({}); handleEdit({ ...p, __type: 'post' }); }}
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
                    <p className="mb-4">This will permanently delete your post.</p>
                    <div className="flex justify-end space-x-2">
                      <button
                        className="px-4 py-2 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400"
                        onClick={() => setShowDeleteModal(prev => ({ ...prev, [key]: false }))}
                      >
                        No
                      </button>
                      <button
                        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                        onClick={() => handleDelete({ ...p, __type: 'post' })}
                      >
                        Yes, Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center mb-4 text-left">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-blue-600 rounded-full mr-3 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {(p.authorName || 'User').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-200">{p.authorName || 'You'}</p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(p.createdAt))} ago
                  </p>
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold mb-3 text-blue-900 dark:text-blue-100 text-left tracking-tight">{p.title}</h3>
              {p.image && (
                <img 
                  src={p.image} 
                  alt={p.title}
                  className="w-full max-h-96 object-cover mb-4 mx-auto block rounded-xl shadow-md"
                />
              )}
              {p.description && (
                <p className="text-indigo-800 dark:text-indigo-200 mb-4 leading-relaxed text-left">{p.description}</p>
              )}
              <ReactionButtons entityType="post" entityId={p.id} user={user} authHeaders={authHeaders} />
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
                <Comments parentType="posts" parentId={p.id} user={user} authHeaders={authHeaders} />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
