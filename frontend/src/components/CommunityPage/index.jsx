import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { auth } from '../../firebase';
import { formatDistanceToNow } from 'date-fns';
import { useAuthState } from 'react-firebase-hooks/auth';

const API_URL = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || 'http://127.0.0.1:5000';
const EMOJIS = { like: '👍', love: '❤️', haha: '😂', sad: '😢' };

export default function CommunityPage() {
  const [user, loading] = useAuthState(auth);
  const [tab, setTab] = useState('all');
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [showPostForm, setShowPostForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImage, setNewImage] = useState('');

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [location, setLocation] = useState('');
  const [photos, setPhotos] = useState(['']);

  const [openComments, setOpenComments] = useState({});

  const authHeaders = async () => {
    if (!user) return {};
    try {
      const token = await user.getIdToken();
      return { Authorization: `Bearer ${token}` };
    } catch {
      return {};
    }
  };

  const fetchPosts = async () => {
    try {
      const headers = user ? await authHeaders() : {};
      const res = await axios.get(`${API_URL}/posts`, { headers });
      setPosts(res.data.posts || []);
    } catch {
      toast.error('Could not load posts');
    }
  };

  const fetchEvents = async () => {
    try {
      const headers = user ? await authHeaders() : {};
      const res = await axios.get(`${API_URL}/events`, { headers });
      setEvents(res.data.events || []);
    } catch {
      toast.error('Could not load events');
    }
  };

  useEffect(() => {
    if (!loading && user) {
      setDataLoading(true);
      Promise.all([fetchPosts(), fetchEvents()]).finally(() => setDataLoading(false));
    }
    // eslint-disable-next-line
  }, [loading, user]);

  const AuthGuard = ({ children, fallback = null }) => {
    if (!user) {
      return fallback || (
        <div className="py-4 px-4 rounded-lg text-left">
          <p className="text-gray-600 text-sm">
            Please <button className="text-blue-600 underline">sign in</button> to interact.
          </p>
        </div>
      );
    }
    return children;
  };

  const getAvailableTabs = () => {
    const tabs = [{ key: 'all', label: 'All' }];
    if (user) {
      tabs.push({ key: 'posts', label: 'Posts' });
      tabs.push({ key: 'events', label: 'Events' });
    }
    return tabs;
  };

  const ReactionButtons = ({ entityType, entityId }) => {
    const [counts, setCounts] = useState({});
    useEffect(() => {
      const fetchCounts = async () => {
        try {
          const res = await axios.get(`${API_URL}/reactions?entityType=${entityType}&entityId=${entityId}`);
          const c = {};
          res.data.reactions?.forEach(r => (c[r.type] = (c[r.type] || 0) + 1));
          setCounts(c);
        } catch {}
      };
      fetchCounts();
    }, [entityType, entityId]);

    if (!user) {
      return (
        <div className="flex flex-wrap gap-2 items-center mt-2 text-left">
          {Object.entries(EMOJIS).map(([type, emoji]) => (
            <div key={type} className="flex items-center px-3 py-1 bg-gray-100 rounded-full">
              <span className="text-lg mr-1">{emoji}</span>
              <span className="text-sm text-gray-600">{counts[type] || 0}</span>
            </div>
          ))}
        </div>
      );
    }

    const fetchR = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/reactions?entityType=${entityType}&entityId=${entityId}`,
          { headers: await authHeaders() }
        );
        const c = {};
        res.data.reactions?.forEach(r => (c[r.type] = (c[r.type] || 0) + 1));
        setCounts(c);
      } catch {}
    };

    useEffect(() => { fetchR(); }, [entityType, entityId]);

    const react = async type => {
      try {
        await axios.post(
          `${API_URL}/reactions`,
          { entityType, entityId, type },
          { headers: await authHeaders() }
        );
        fetchR();
      } catch {
        toast.error('Failed to add reaction');
      }
    };

    return (
      <div className="flex flex-wrap gap-2 items-center mt-2 text-left">
        {Object.entries(EMOJIS).map(([type, emoji]) => (
          <button
            key={type}
            onClick={() => react(type)}
            className="flex items-center px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            <span className="text-lg mr-1">{emoji}</span>
            <span className="text-sm">{counts[type] || 0}</span>
          </button>
        ))}
      </div>
    );
  };

  const Comments = ({ parentType, parentId }) => {
    const [comments, setComments] = useState([]);
    const [text, setText] = useState('');
    const [replyTo, setReplyTo] = useState(null);

    const fetchComments = async () => {
      try {
        const headers = user ? await authHeaders() : {};
        const res = await axios.get(
          `${API_URL}/${parentType}/${parentId}/comments`,
          { headers }
        );
        setComments(res.data.comments || []);
      } catch {}
    };

    useEffect(() => { fetchComments(); }, [parentType, parentId]);

    const submit = async e => {
      e.preventDefault();
      if (!text.trim() || !user) return;
      try {
        await axios.post(
          `${API_URL}/${parentType}/${parentId}/comments`,
          { text, parentCommentId: replyTo || undefined },
          { headers: await authHeaders() }
        );
        setText('');
        setReplyTo(null);
        fetchComments();
      } catch {
        toast.error('Failed to post comment');
      }
    };

    const renderThread = (pid, depth = 0) =>
      comments
        .filter(c => (c.parentCommentId || null) === pid)
        .map(c => (
          <div
            key={c.id}
            className={`py-3 ${depth > 0 ? 'pl-4 md:pl-6 border-l-2 border-gray-300 ml-2 md:ml-4' : 'pl-0'}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
              <span className="font-medium text-blue-900 dark:text-blue-200">{c.authorName || c.author}</span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(c.createdAt))} ago
              </span>
            </div>
            <div className="text-indigo-800 dark:text-indigo-200 mb-2 break-words text-left">{c.text}</div>
            <div className="flex flex-wrap gap-4 text-xs">
              <AuthGuard fallback={null}>
                <button 
                  onClick={() => setReplyTo(c.id)} 
                  className="text-blue-600 hover:text-blue-800"
                >
                  Reply
                </button>
              </AuthGuard>
              <ReactionButtons entityType="comment" entityId={c.id} />
            </div>
            {renderThread(c.id, depth + 1)}
          </div>
        ));

    return (
      <div className="mt-4 pt-4 text-left">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">Comments</h4>
        {renderThread(null)}
        <AuthGuard>
          <form onSubmit={submit} className="mt-4 space-y-3">
            {replyTo && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Replying to comment...</span>
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
                onChange={e => setText(e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
                placeholder="Add a comment..."
              />
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors sm:self-start"
              >
                Post
              </button>
            </div>
          </form>
        </AuthGuard>
      </div>
    );
  };

  const RSVPButtons = ({ eventId }) => {
    const [status, setStatus] = useState(null);
    const [summary, setSummary] = useState({ yes: [], no: [], maybe: [] });

    if (!user) {
      useEffect(() => {
        const fetchPublicRSVP = async () => {
          try {
            const res = await axios.get(`${API_URL}/events/${eventId}/rsvps`);
            const rsvps = res.data.rsvps || [];
            const summary = { yes: [], no: [], maybe: [] };
            rsvps.forEach(r => {
              if (summary[r.status]) summary[r.status].push(r.userName || r.user);
            });
            setSummary(summary);
          } catch {}
        };
        fetchPublicRSVP();
      }, [eventId]);

      return (
        <div className="mt-3 text-left">
          <div className="text-sm text-gray-600 space-y-1">
            <div><span className="font-medium">Going:</span> {summary.yes.join(', ') || 'None'}</div>
            <div><span className="font-medium">Maybe:</span> {summary.maybe.join(', ') || 'None'}</div>
            <div><span className="font-medium">Not Going:</span> {summary.no.join(', ') || 'None'}</div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Sign in to RSVP</p>
        </div>
      );
    }

    const fetchRSVP = async () => {
      try {
        const uid = user.uid;
        const res = await axios.get(`${API_URL}/events/${eventId}/rsvps`, { headers: await authHeaders() });
        const rsvps = res.data.rsvps || [];
        const yours = rsvps.find(r => r.user === uid);
        setStatus(yours ? yours.status : null);
        const summary = { yes: [], no: [], maybe: [] };
        rsvps.forEach(r => {
          if (summary[r.status]) summary[r.status].push(r.userName || r.user);
        });
        setSummary(summary);
      } catch {}
    };

    useEffect(() => { fetchRSVP(); }, [eventId]);

    const reply = async s => {
      try {
        await axios.post(
          `${API_URL}/events/${eventId}/rsvp`,
          { status: s },
          { headers: await authHeaders() }
        );
        setStatus(s);
        toast.success(`RSVP ${s}`);
        fetchRSVP();
      } catch {
        toast.error('RSVP failed');
      }
    };

    return (
      <div className="mt-3 space-y-3 text-left">
        <div className="flex flex-wrap gap-2">
          {['yes', 'no', 'maybe'].map(s => (
            <button
              key={s}
              onClick={() => reply(s)}
              className={`px-4 py-2 rounded-full border transition-colors ${
                status === s 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="text-sm text-gray-600 space-y-1">
          <div><span className="font-medium">Going:</span> {summary.yes.join(', ') || 'None'}</div>
          <div><span className="font-medium">Maybe:</span> {summary.maybe.join(', ') || 'None'}</div>
          <div><span className="font-medium">Not Going:</span> {summary.no.join(', ') || 'None'}</div>
        </div>
      </div>
    );
  };

  const combined = [
    ...posts.map(p => ({ ...p, __type: 'post' })),
    ...events.map(e => ({ ...e, __type: 'event' }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community...</p>
        </div>
      </div>
    );
  }

  const CommentIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8-1.593 0-3.086-.308-4.405-.86L3 21l1.02-3.186C3.364 16.026 3 14.547 3 13c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {!user && (
          <div className="mb-6 p-4 rounded-lg text-left bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
            <h2 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Welcome to our Community!</h2>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              You're viewing the community feed. Sign in to create posts, events, comment, and interact.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 border-b border-gray-200 overflow-x-auto text-left">
          {getAvailableTabs().map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                tab === key
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* All feed */}
        {tab === 'all' && (
          <div>
            {combined.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No posts or events yet</p>
              </div>
            ) : (
              combined.map(item => {
                const key = item.__type + '-' + item.id;
                return (
                  <div 
                    key={key}
                    className="rounded-2xl border border-blue-100 dark:border-indigo-900 shadow-lg p-4 sm:p-6 mb-8
                               bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 transition"
                  >
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
                        <ReactionButtons entityType="post" entityId={item.id} />

                        {/* Comments toggle button */}
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
                          <Comments parentType="posts" parentId={item.id} />
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
                        <RSVPButtons eventId={item.id} />
                        <ReactionButtons entityType="event" entityId={item.id} />
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
                          <Comments parentType="events" parentId={item.id} />
                        )}
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Posts-only tab */}
        {tab === 'posts' && user && (
          <div className="space-y-8">
            <button
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              onClick={() => setShowPostForm(f => !f)}
            >
              {showPostForm ? "Cancel" : "Create New Post"}
            </button>
            
            {showPostForm && (
              <form 
                onSubmit={async e => {
                  await handleCreatePost(e);
                  setShowPostForm(false);
                }} 
                className="rounded-2xl border border-blue-100 dark:border-indigo-900 shadow-lg p-6 mb-8 text-left
                           bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900"
              >
                <h3 className="font-semibold text-lg text-blue-900 dark:text-blue-100">Create New Post</h3>
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
                    Publish Post
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowPostForm(false)}
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
                                            bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
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
                    <ReactionButtons entityType="post" entityId={p.id} />
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
                      <Comments parentType="posts" parentId={p.id} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Events-only tab */}
        {tab === 'events' && user && (
          <div className="space-y-8">
            <button
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              onClick={() => setShowEventForm(f => !f)}
            >
              {showEventForm ? "Cancel" : "Create New Event"}
            </button>
            
            {showEventForm && (
              <form 
                onSubmit={async e => {
                  await handleCreateEvent(e);
                  setShowEventForm(false);
                }} 
                className="rounded-2xl border border-blue-100 dark:border-indigo-900 shadow-lg p-6 mb-8 text-left
                           bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900"
              >
                <h3 className="font-semibold text-lg text-blue-900 dark:text-blue-100">Create New Event</h3>
                <input
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Event title"
                  value={title} 
                  onChange={e => setTitle(e.target.value)}
                  required
                />
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Event description"
                  value={desc} 
                  onChange={e => setDesc(e.target.value)}
                />
                <input
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                />
                <input
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Event location"
                  value={location} 
                  onChange={e => setLocation(e.target.value)}
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Event Photos</label>
                  {photos.map((url, i) => (
                    <input
                      key={i}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Photo URL"
                      value={url}
                      onChange={e => {
                        const newPhotos = [...photos]; 
                        newPhotos[i] = e.target.value; 
                        setPhotos(newPhotos);
                      }}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setPhotos(prev => [...prev, ''])}
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
                    Create Event
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowEventForm(false)}
                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            
            {/* Events List */}
            {events.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No events yet. Create the first one!</p>
              </div>
            ) : (
              events.map(ev => {
                const key = 'event-' + ev.id;
                return (
                  <div key={key} className="rounded-2xl border border-blue-100 dark:border-indigo-900 shadow-lg p-4 sm:p-6 mb-8 text-left
                                            bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 text-left">
                      <h3 className="text-lg sm:text-xl font-extrabold text-blue-900 dark:text-blue-100 mb-2 sm:mb-0 tracking-tight">{ev.title}</h3>
                      <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                        {formatDistanceToNow(new Date(ev.createdAt))} ago
                      </span>
                    </div>
                    {ev.description && (
                      <p className="text-indigo-800 dark:text-indigo-200 mb-4 leading-relaxed text-left">{ev.description}</p>
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
                    {ev.photos?.filter(u => u).map((url, i) => (
                      <img 
                        key={i} 
                        src={url} 
                        alt={`Event photo ${i + 1}`}
                        className="w-full max-h-64 object-cover mb-4 mx-auto block rounded-xl shadow-md"
                      />
                    ))}
                    <RSVPButtons eventId={ev.id} />
                    <ReactionButtons entityType="event" entityId={ev.id} />
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
                      <Comments parentType="events" parentId={ev.id} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );

  async function handleCreatePost(e) {
    e.preventDefault();
    if (!newTitle.trim()) return toast.warn('Title required');
    if (!user) return toast.error('Please sign in to create posts');
    try {
      await axios.post(
        `${API_URL}/posts`,
        { title: newTitle, description: newDesc, image: newImage },
        { headers: await authHeaders() }
      );
      toast.success('Post created successfully!');
      setNewTitle(''); 
      setNewDesc(''); 
      setNewImage('');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to create post');
    }
  }

  async function handleCreateEvent(e) {
    e.preventDefault();
    if (!title.trim()) return toast.warn('Title required');
    if (!user) return toast.error('Please sign in to create events');
    try {
      await axios.post(
        `${API_URL}/events`,
        { 
          title, 
          description: desc, 
          dateFilter, 
          location, 
          photos: photos.filter(u => u.trim()) 
        },
        { headers: await authHeaders() }
      );
      toast.success('Event created successfully!');
      setTitle(''); 
      setDesc(''); 
      setDateFilter(''); 
      setLocation(''); 
      setPhotos(['']);
      fetchEvents();
    } catch (error) {
      toast.error('Failed to create event');
    }
  }
}
