// components/community/CommunityCommon.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';

export const API_URL =
  import.meta.env.VITE_API_URL ||
  process.env.VITE_API_URL ||
  'http://127.0.0.1:5000';

export const EMOJIS = { like: '👍', love: '❤️', haha: '😂', sad: '😢' };

/* ----------------------------- Utilities ----------------------------- */

function useOutsideCloser(openMap, refsMap, onClose) {
  useEffect(() => {
    function onDocClick(e) {
      Object.keys(openMap || {}).forEach((k) => {
        if (
          openMap[k] &&
          refsMap.current?.[k] &&
          !refsMap.current[k].contains(e.target)
        ) {
          onClose((prev) => ({ ...prev, [k]: false }));
        }
      });
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [openMap, refsMap, onClose]);
}

function endpointFor(parentType, parentId, commentId) {
  // parentType is 'posts' or 'events'
  const base = `${API_URL}/${parentType}/${parentId}/comments`;
  return commentId ? `${base}/${commentId}` : base;
}

/* --------------------------- Reaction Buttons --------------------------- */

export function ReactionButtons({ entityType, entityId, user, authHeaders }) {
  const [counts, setCounts] = useState({});

  const fetchCounts = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/reactions?entityType=${entityType}&entityId=${entityId}`
      );
      const c = {};
      res.data.reactions?.forEach((r) => (c[r.type] = (c[r.type] || 0) + 1));
      setCounts(c);
    } catch (err) {
      console.debug('[reactions] fetchCounts failed', err?.message);
    }
  };

  useEffect(() => {
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  if (!user) {
    return (
      <div className="flex flex-wrap gap-2 items-center mt-2 text-left">
        {Object.entries(EMOJIS).map(([type, emoji]) => (
          <div
            key={type}
            className="flex items-center px-3 py-1 bg-white rounded-full"
          >
            <span className="text-lg mr-1">{emoji}</span>
            <span className="text-sm text-gray-600">{counts[type] || 0}</span>
          </div>
        ))}
      </div>
    );
  }

  const react = async (type) => {
    try {
      const headers = await authHeaders();
      console.groupCollapsed('[reactions] POST', { entityType, entityId, type });
      console.log('headers', headers);
      const res = await axios.post(
        `${API_URL}/reactions`,
        { entityType, entityId, type },
        { headers }
      );
      console.log('response', res.status, res.data);
      console.groupEnd();
      fetchCounts();
    } catch (err) {
      console.groupCollapsed('[reactions] ERROR');
      console.error(err);
      console.groupEnd();
      toast.error('Failed to add reaction');
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center mt-2 text-left">
      {Object.entries(EMOJIS).map(([type, emoji]) => (
        <button
          key={type}
          onClick={() => react(type)}
          className="flex items-center px-3 py-1 bg-white rounded-full hover:bg-gray-200 transition-colors"
        >
          <span className="text-lg mr-1">{emoji}</span>
          <span className="text-sm">{counts[type] || 0}</span>
        </button>
      ))}
    </div>
  );
}

/* -------------------------------- Comments --------------------------------
   - Inline editing
   - Author-only 3-dot menu
   - Simple Yes/No delete confirmation
   - Detailed console logging
-----------------------------------------------------------------------------*/

export function Comments({ parentType, parentId, user, authHeaders }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);

  // menus & inline editing
  const [menuOpen, setMenuOpen] = useState({});
  const menuRefs = useRef({});
  useOutsideCloser(menuOpen, menuRefs, setMenuOpen);

  const [editingComments, setEditingComments] = useState({});
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });

  const canEdit = (c) => !!user && c.author === user.uid;

  const fetchComments = async () => {
    try {
      const headers = user ? await authHeaders() : {};
      console.groupCollapsed('[comments] GET list', { parentType, parentId });
      console.log('headers', headers);
      const res = await axios.get(endpointFor(parentType, parentId), { headers });
      console.log('response', res.status, res.data);
      console.groupEnd();
      setComments(res.data.comments || []);
    } catch (err) {
      console.groupCollapsed('[comments] GET list ERROR');
      console.error(err);
      console.groupEnd();
    }
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentType, parentId, user?.uid]);

  // Create / reply
  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    try {
      const headers = await authHeaders();
      const payload = { text, parentCommentId: replyTo || undefined };
      console.groupCollapsed('[comments] POST create', payload);
      console.log('endpoint', endpointFor(parentType, parentId));
      console.log('headers', headers);
      const res = await axios.post(endpointFor(parentType, parentId), payload, {
        headers,
      });
      console.log('response', res.status, res.data);
      console.groupEnd();

      setText('');
      setReplyTo(null);
      fetchComments();
    } catch (err) {
      console.groupCollapsed('[comments] POST ERROR');
      console.error(err);
      console.groupEnd();
      toast.error('Failed to post comment');
    }
  };

  // Start inline editing
  const startEdit = (c) => {
    setEditingComments((prev) => ({ ...prev, [c.id]: c.text || '' }));
    setMenuOpen({});
  };

  // Cancel inline editing
  const cancelEdit = (commentId) => {
    setEditingComments((prev) => {
      const next = { ...prev };
      delete next[commentId];
      return next;
    });
  };

  // Save inline edit
  const saveEdit = async (commentId) => {
    const editText = editingComments[commentId];
    if (!editText || !commentId) return;

    try {
      const headers = await authHeaders();
      const url = endpointFor(parentType, parentId, commentId);
      const payload = { text: editText };
      console.groupCollapsed('[comments] PUT edit');
      console.log('url', url);
      console.log('payload', payload);
      console.log('headers', headers);
      const res = await axios.put(url, payload, { headers });
      console.log('response', res.status, res.data);
      console.groupEnd();

      toast.success('Comment updated');
      setEditingComments((prev) => {
        const next = { ...prev };
        delete next[commentId];
        return next;
      });
      fetchComments();
    } catch (err) {
      console.groupCollapsed('[comments] PUT ERROR');
      console.error(err?.response || err);
      console.groupEnd();
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Failed to update comment';
      toast.error(msg);
    }
  };

  // Delete confirmation
  const openDelete = (c) => {
    setDeleteModal({ open: true, id: c.id });
    setMenuOpen({});
  };

  const doDelete = async () => {
    if (!deleteModal.id) return;
    try {
      const baseHeaders = await authHeaders();
      const url = endpointFor(parentType, parentId, deleteModal.id);

      console.groupCollapsed('[comments] DELETE');
      console.log('url', url);
      console.log('headers', baseHeaders);

      // IMPORTANT: axios.delete needs body in `data`, plus explicit JSON headers
      const res = await axios.delete(url, {
        data: {}, // empty JSON body to avoid strict 415s
        headers: {
          ...baseHeaders,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        validateStatus: (s) => s < 500,
      });

      console.log('response', res.status, res.data);
      console.groupEnd();

      if (res.status >= 200 && res.status < 300) {
        toast.success('Comment deleted');
        setDeleteModal({ open: false, id: null });
        fetchComments();
      } else {
        const msg = res?.data?.error || `Delete failed (${res.status})`;
        toast.error(msg);
      }
    } catch (err) {
      console.groupCollapsed('[comments] DELETE ERROR');
      console.error(err?.response || err);
      console.groupEnd();
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Failed to delete comment';
      toast.error(msg);
    }
  };

  /* -------- threaded render -------- */

  const renderThread = (pid, depth = 0) =>
    comments
      .filter((c) => (c.parentCommentId || null) === pid)
      .map((c) => {
        const key = c.id;
        const isEditing = Object.prototype.hasOwnProperty.call(
          editingComments,
          c.id
        );
        const authorInitial = (c.authorName || c.author || 'U')
          .toString()
          .trim()
          .charAt(0)
          .toUpperCase();

        return (
          <div
            key={key}
            className={`py-3 ${
              depth > 0
                ? 'pl-4 md:pl-6 border-l-2 border-gray-300 ml-2 md:ml-4'
                : 'pl-0'
            } relative`}
          >
            {/* author + time */}
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                {authorInitial}
              </div>
              <span className="font-medium text-black">
                {c.authorName || c.author}
              </span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(c.createdAt))} ago
              </span>

              {/* author-only menu */}
              {canEdit(c) && !isEditing && (
                <div
                  ref={(el) => (menuRefs.current[key] = el)}
                  className="ml-auto relative"
                >
                  <button
                    onClick={() =>
                      setMenuOpen((prev) => ({ ...prev, [key]: !prev[key] }))
                    }
                    className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200"
                    aria-label="More"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <circle cx="5" cy="12" r="2" />
                      <circle cx="12" cy="12" r="2" />
                      <circle cx="19" cy="12" r="2" />
                    </svg>
                  </button>

                  {menuOpen[key] && (
                    <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20">
                      <button
                        className="w-full text-left px-4 py-2 text-black hover:bg-gray-200 rounded-t-lg transition-all duration-200"
                        onClick={() => startEdit(c)}
                      >
                        Edit
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-200 rounded-b-lg transition-all duration-200"
                        onClick={() => openDelete(c)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* text or edit form */}
            {isEditing ? (
              <div className="mb-2">
                <textarea
                  value={editingComments[c.id]}
                  onChange={(e) =>
                    setEditingComments((prev) => ({
                      ...prev,
                      [c.id]: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none dark:bg-gray-700 dark:text-white"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => saveEdit(c.id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => cancelEdit(c.id)}
                    className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-black mb-2 break-words text-left">
                {c.text}
              </div>
            )}

            {/* actions under each comment - only show if not editing */}
            {!isEditing && (
              <div className="flex flex-wrap gap-4 text-xs">
                {user && (
                  <button
                    onClick={() => setReplyTo(c.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Reply
                  </button>
                )}
                <ReactionButtons
                  entityType="comment"
                  entityId={c.id}
                  user={user}
                  authHeaders={authHeaders}
                />
              </div>
            )}

            {/* children */}
            {renderThread(c.id, depth + 1)}
          </div>
        );
      });

  return (
    <div className="mt-2 pt-2 text-left">


      {renderThread(null)}

      {/* composer */}
      {user && (
        <form onSubmit={submit} className="mt-4 space-y-3">
          {replyTo && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Replying to comment…</span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Cancel
              </button>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 p-3 border-2 border-gray-400 focus:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              placeholder="Add a comment..."
            />
            <button
              type="submit"
              className="px-4 py-3 md:py-6 text-lg text-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors sm:self-start"
            >
              Post
            </button>
          </div>
        </form>
      )}

      {/* Simple Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-5 w-full max-w-md">
            <h3 className="font-semibold text-lg mb-2 text-gray-800 dark:text-white">
              Delete comment?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500"
                onClick={() => setDeleteModal({ open: false, id: null })}
              >
                No
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                onClick={doDelete}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- RSVP Buttons ------------------------------- */

export function RSVPButtons({ eventId, user, authHeaders }) {
  const [status, setStatus] = useState(null);
  const [summary, setSummary] = useState({ yes: [], no: [], maybe: [] });

  const fetchRSVP = async () => {
    try {
      const headers = user ? await authHeaders() : {};
      const res = await axios.get(`${API_URL}/events/${eventId}/rsvps`, {
        headers,
      });
      const rsvps = res.data.rsvps || [];

      if (user?.uid) {
        const yours = rsvps.find((r) => r.user === user.uid);
        setStatus(yours ? yours.status : null);
      }

      const next = { yes: [], no: [], maybe: [] };
      rsvps.forEach((r) => {
        if (next[r.status]) next[r.status].push(r.userName || r.user);
      });
      setSummary(next);
    } catch {
      /* noop */
    }
  };

  useEffect(() => {
    fetchRSVP();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, user?.uid]);

  const reply = async (s) => {
    if (!user) return;
    try {
      const headers = await authHeaders();
      const res = await axios.post(
        `${API_URL}/events/${eventId}/rsvp`,
        { status: s },
        { headers }
      );
      console.debug('[rsvp] response', res.status, res.data);
      setStatus(s);
      toast.success(`RSVP ${s}`);
      fetchRSVP();
    } catch (err) {
      console.error('[rsvp] ERROR', err);
      toast.error('RSVP failed');
    }
  };
  
  const base =
    'flex-1 sm:flex-none px-4 py-2 rounded-lg backdrop-blur-md border transition-all duration-300 font-medium text-black';
  
const btnClass = (s) => {
  if (s === 'yes') {
    return status === 'yes'
      ? `${base} bg-green-100 text-green-700 border-green-400 shadow-[0_0_12px_rgba(34,197,94,0.5)] scale-105`
      : `${base} bg-green-50 text-green-600 border-green-300 hover:bg-green-100 hover:border-green-400`;
  }
  if (s === 'no') {
    return status === 'no'
      ? `${base} bg-rose-100 text-rose-700 border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.5)] scale-105`
      : `${base} bg-rose-50 text-rose-600 border-rose-300 hover:bg-rose-100 hover:border-rose-400`;
  }
  return status === 'maybe'
    ? `${base} bg-indigo-100 text-indigo-700 border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.5)] scale-105`
    : `${base} bg-indigo-50 text-indigo-600 border-indigo-300 hover:bg-indigo-100 hover:border-indigo-400`;
};

    
  
  if (!user) {
    return (
      <div className="rounded-xl bg-gradient-to-r from-pink-50/90 to-purple-50/90 border border-purple-200 p-4 text-sm space-y-2 shadow-md backdrop-blur-md">
  <div>
    <span className="font-semibold text-purple-800">Going:</span>{' '}
    <span className="text-gray-900">
      {summary.yes.length ? summary.yes.join(', ') : 'None'}
    </span>
  </div>
  <div>
    <span className="font-semibold text-purple-800">Maybe:</span>{' '}
    <span className="text-gray-900">
      {summary.maybe.length ? summary.maybe.join(', ') : 'None'}
    </span>
  </div>
  <div>
    <span className="font-semibold text-purple-800">Not Going:</span>{' '}
    <span className="text-gray-900">
      {summary.no.length ? summary.no.join(', ') : 'None'}
    </span>
  </div>
</div>

    );
  }
  
  return (
    <div className="mt-3 space-y-3 text-left">
      <div className="flex flex-col sm:flex-row gap-2">
        <button onClick={() => reply('yes')} className={btnClass('yes')}>
          ✓ Yes
        </button>
        <button onClick={() => reply('no')} className={btnClass('no')}>
          ✗ No
        </button>
        <button onClick={() => reply('maybe')} className={btnClass('maybe')}>
          ? Maybe
        </button>
      </div>
  
      <div className="rounded-xl bg-white border border-gray-200 shadow-md p-4 my-4 text-sm space-y-2">
  <div>
    <span className="font-semibold text-gray-900">Going:</span>{' '}
    <span className="text-gray-800">
      {summary.yes.length ? summary.yes.join(', ') : 'None'}
    </span>
  </div>
  <div>
    <span className="font-semibold text-gray-900">Maybe:</span>{' '}
    <span className="text-gray-800">
      {summary.maybe.length ? summary.maybe.join(', ') : 'None'}
    </span>
  </div>
  <div>
    <span className="font-semibold text-gray-900">Not Going:</span>{' '}
    <span className="text-gray-800">
      {summary.no.length ? summary.no.join(', ') : 'None'}
    </span>
  </div>
</div>



    </div>
  );
}