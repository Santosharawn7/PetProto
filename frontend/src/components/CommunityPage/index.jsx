import React, { useState, useEffect, useRef } from 'react';
import Header from '../Header';
import axios from 'axios';
import { toast } from 'react-toastify';
import { auth } from '../../firebase';
import { formatDistanceToNow } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || 'http://127.0.0.1:5000';
const EMOJIS = { like: '👍', love: '❤️', haha: '😂', sad: '😢' };

export default function CommunityPage() {
  const [tab, setTab] = useState('all');
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const lastFetchedRef = useRef({ posts: [], events: [] });

  // For toggling forms
  const [showPostForm, setShowPostForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);

  // Post form states
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImage, setNewImage] = useState('');

  // Event form states
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [location, setLocation] = useState('');
  const [photos, setPhotos] = useState(['']);

  // Auth header
  const authHeaders = async () => {
    const token = await auth.currentUser.getIdToken();
    return { Authorization: `Bearer ${token}` };
  };

  // Fetch posts
  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API_URL}/posts`, { headers: await authHeaders() });
      setPosts(res.data.posts || []);
    } catch {
      toast.error('Could not load posts');
    }
  };

  // Fetch events
  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API_URL}/events`, { headers: await authHeaders() });
      setEvents(res.data.events || []);
    } catch {
      toast.error('Could not load events');
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPosts(), fetchEvents()]).finally(() => setLoading(false));
  }, []);

  // --- ReactionButtons, Comments, RSVPButtons below ---

  const ReactionButtons = ({ entityType, entityId }) => {
    const [counts, setCounts] = useState({});
    const fetchR = async () => {
      const res = await axios.get(
        `${API_URL}/reactions?entityType=${entityType}&entityId=${entityId}`,
        { headers: await authHeaders() }
      );
      const c = {};
      res.data.reactions.forEach(r => (c[r.type] = (c[r.type]||0)+1));
      setCounts(c);
    };
    useEffect(() => { fetchR(); }, [entityType, entityId]);
    const react = async type => {
      await axios.post(
        `${API_URL}/reactions`,
        { entityType, entityId, type },
        { headers: await authHeaders() }
      );
      fetchR();
    };
    return (
      <div className="flex space-x-3 items-center mt-2">
        {Object.entries(EMOJIS).map(([type, emoji]) => (
          <button
            key={type}
            onClick={() => react(type)}
            className="px-2 py-1 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            <span className="text-xl">{emoji}</span>
            <span className="ml-1 text-sm">{counts[type]||0}</span>
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
      const res = await axios.get(
        `${API_URL}/${parentType}/${parentId}/comments`,
        { headers: await authHeaders() }
      );
      setComments(res.data.comments || []);
    };
    useEffect(() => { fetchComments(); }, [parentType, parentId]);

    const submit = async e => {
      e.preventDefault();
      if (!text.trim()) return;
      await axios.post(
        `${API_URL}/${parentType}/${parentId}/comments`,
        { text, parentCommentId: replyTo || undefined },
        { headers: await authHeaders() }
      );
      setText('');
      setReplyTo(null);
      fetchComments();
    };

    // Thread styling: border-l and extra margin for replies
    const renderThread = (pid, depth = 0) =>
      comments
        .filter(c => (c.parentCommentId||null)===pid)
        .map(c => (
          <div
            key={c.id}
            className={`py-2 ${depth > 0 ? 'pl-6 border-l-2 border-gray-300 ml-2' : 'pl-0'}`}
            style={{ textAlign: 'left' }}
          >
            <div className="text-sm text-gray-800">
              <strong>{c.authorName || c.author}</strong>
              <span className="text-gray-500 font-normal ml-2">
                {formatDistanceToNow(new Date(c.createdAt))} ago
              </span>
            </div>
            <div className="text-gray-700">{c.text}</div>
            <div className="flex space-x-4 text-xs mt-1">
              <button onClick={() => setReplyTo(c.id)} className="text-blue-600">Reply</button>
              <ReactionButtons entityType="comment" entityId={c.id}/>
            </div>
            {renderThread(c.id, depth+1)}
          </div>
        ));

    return (
      <div className="mt-4" style={{ textAlign: 'left' }}>
        {renderThread(null)}
        <form onSubmit={submit} className="mt-2 flex space-x-2" style={{ textAlign: 'left' }}>
          {replyTo && (
            <div className="text-sm text-gray-600">
              Replying…{' '}
              <button onClick={()=>setReplyTo(null)} className="underline">
                Cancel
              </button>
            </div>
          )}
          <textarea
            value={text}
            onChange={e=>setText(e.target.value)}
            className="flex-1 p-2 border rounded"
            rows={2}
            placeholder="Add a comment…"
            style={{ textAlign: 'left' }}
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
            Post
          </button>
        </form>
      </div>
    );
  };

  // RSVP with persistent status and RSVP summary
  const RSVPButtons = ({ eventId }) => {
    const [status, setStatus] = useState(null);
    const [summary, setSummary] = useState({yes: [], no: [], maybe: []});
    const [userId, setUserId] = useState('');

    const fetchRSVP = async () => {
      const t = await auth.currentUser.getIdToken();
      const uid = auth.currentUser.uid;
      setUserId(uid);
      try {
        const res = await axios.get(`${API_URL}/events/${eventId}/rsvps`, { headers: { Authorization: `Bearer ${t}` } });
        const rsvps = res.data.rsvps || [];
        const yours = rsvps.find(r => r.user === uid);
        setStatus(yours ? yours.status : null);
        const summary = { yes: [], no: [], maybe: [] };
        rsvps.forEach(r => {
          if (summary[r.status]) summary[r.status].push(r.userName || r.user);
        });
        setSummary(summary);
      } catch {/* ignore */}
    };

    useEffect(() => { fetchRSVP(); }, [eventId]);

    const reply = async s => {
      await axios.post(
        `${API_URL}/events/${eventId}/rsvp`,
        { status: s },
        { headers: await authHeaders() }
      );
      setStatus(s);
      toast.success(`RSVP ${s}`);
      fetchRSVP();
    };

    return (
      <div className="flex flex-col items-start mt-2">
        <div className="flex space-x-2 mb-1">
          {['yes','no','maybe'].map(s => (
            <button
              key={s}
              onClick={()=>reply(s)}
              className={`px-3 py-1 rounded-full border ${status===s?'bg-blue-600 text-white':'bg-white text-gray-700'}`}
              style={{ textAlign: 'left' }}
            >
              {s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-700 mt-1">
          <span className="mr-3">Going: {summary.yes.join(', ') || 'None'}</span>
          <span className="mr-3">Maybe: {summary.maybe.join(', ') || 'None'}</span>
          <span>Not Going: {summary.no.join(', ') || 'None'}</span>
        </div>
      </div>
    );
  };

  // Combine for “All” tab
  const combined = [
    ...posts.map(p => ({ ...p, __type: 'post' })),
    ...events.map(e => ({ ...e, __type: 'event' }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (loading) {
    return <p className="p-6 text-center">Loading community…</p>;
  }

  return (
    <>
      <Header />
      <div className=" max-w-5xl md:max-w-3xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b">
          {['all','posts','events'].map(key => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={
                tab===key
                  ? 'pb-2 border-b-2 border-blue-600'
                  : 'pb-2 text-gray-600 hover:text-gray-800'
              }
            >
              {key.charAt(0).toUpperCase()+key.slice(1)}
            </button>
          ))}
        </div>

        {/* All feed */}
        {tab==='all' && combined.map(item => {
          if (item.__type==='post') {
            return (
              <div key={item.id} className="border p-4 rounded mb-6 bg-white shadow-sm" style={{ textAlign: 'left' }}>
                {/* Post Card */}
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 mr-3" />
                  <div>
                    <p className="font-semibold">{item.authorName||'You'}</p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(item.createdAt))} ago
                    </p>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full aspect-square object-cover rounded mb-2"
                  />
                )}
                <ReactionButtons entityType="post" entityId={item.id} />
                <p className="mt-2 text-sm text-gray-700">{item.description}</p>
                <Comments parentType="posts" parentId={item.id} />
              </div>
            );
          } else {
            return (
              <div key={item.id} className="border p-4 rounded mb-6 bg-white shadow-sm" style={{ textAlign: 'left' }}>
                {/* Event Card */}
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <span className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(item.createdAt))} ago
                  </span>
                </div>
                <p>{item.description}</p>
                {item.dateFilter && (
                  <p><strong>Date:</strong> {new Date(item.dateFilter).toLocaleDateString()}</p>
                )}
                {item.location && (
                  <p><strong>Location:</strong> {item.location}</p>
                )}
                {item.photos?.map((u,i)=>(
                  <img key={i} src={u} alt="" className="w-full max-h-48 object-cover rounded my-2"/>
                ))}
                <RSVPButtons eventId={item.id} />
                <ReactionButtons entityType="event" entityId={item.id}/>
                <Comments parentType="events" parentId={item.id}/>
              </div>
            );
          }
        })}

        {/* Posts-only tab */}
        {tab==='posts' && (
          <>
            <button
              className="mb-4 px-4 py-2 bg-blue-600 text-white rounded"
              onClick={() => setShowPostForm(f => !f)}
            >
              {showPostForm ? "Close New Post" : "New Post"}
            </button>
            {showPostForm && (
              <form onSubmit={async e => {
                await handleCreatePost(e);
                setShowPostForm(false);
              }} className="mb-6 p-4 border rounded" style={{ textAlign: 'left' }}>
                <h3 className="font-semibold">New Post</h3>
                <input
                  className="w-full p-2 border rounded mb-2"
                  placeholder="Title"
                  value={newTitle} onChange={e=>setNewTitle(e.target.value)}
                  required
                  style={{ textAlign: 'left' }}
                />
                <textarea
                  className="w-full p-2 border rounded mb-2"
                  rows={3}
                  placeholder="Description"
                  value={newDesc} onChange={e=>setNewDesc(e.target.value)}
                  style={{ textAlign: 'left' }}
                />
                <input
                  className="w-full p-2 border rounded mb-2"
                  placeholder="Image URL (optional)"
                  value={newImage} onChange={e=>setNewImage(e.target.value)}
                  style={{ textAlign: 'left' }}
                />
                <button className="px-4 py-2 bg-green-600 text-white rounded">Post</button>
              </form>
            )}
            {posts.map(p => (
              <div key={p.id} className="border p-4 rounded mb-6 bg-white shadow-sm" style={{ textAlign: 'left' }}>
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"/>
                  <div>
                    <p className="font-semibold">{p.authorName||'You'}</p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(p.createdAt))} ago
                    </p>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">{p.title}</h3>
                {p.image && (
                  <img src={p.image} alt={p.title}
                    className="w-full aspect-square object-cover rounded mb-2"/>
                )}
                <ReactionButtons entityType="post" entityId={p.id}/>
                <p className="mt-2 text-sm text-gray-700">{p.description}</p>
                <Comments parentType="posts" parentId={p.id}/>
              </div>
            ))}
          </>
        )}

        {/* Events-only tab */}
        {tab==='events' && (
          <>
            <button
              className="mb-4 px-4 py-2 bg-blue-600 text-white rounded"
              onClick={() => setShowEventForm(f => !f)}
            >
              {showEventForm ? "Close New Event" : "New Event"}
            </button>
            {showEventForm && (
              <form onSubmit={async e => {
                await handleCreateEvent(e);
                setShowEventForm(false);
              }} className="mb-6 p-4 border rounded" style={{ textAlign: 'left' }}>
                <h3 className="font-semibold">New Event</h3>
                <input
                  className="w-full p-2 border rounded mb-2"
                  placeholder="Title"
                  value={title} onChange={e=>setTitle(e.target.value)}
                  required
                  style={{ textAlign: 'left' }}
                />
                <textarea
                  className="w-full p-2 border rounded mb-2"
                  rows={2}
                  placeholder="Description"
                  value={desc} onChange={e=>setDesc(e.target.value)}
                  style={{ textAlign: 'left' }}
                />
                <input
                  type="date"
                  className="w-full p-2 border rounded mb-2"
                  value={dateFilter}
                  onChange={e=>setDateFilter(e.target.value)}
                  style={{ textAlign: 'left' }}
                />
                <input
                  className="w-full p-2 border rounded mb-2"
                  placeholder="Location"
                  value={location} onChange={e=>setLocation(e.target.value)}
                  style={{ textAlign: 'left' }}
                />
                {photos.map((u,i) => (
                  <input
                    key={i}
                    className="w-full p-2 border rounded mb-2"
                    placeholder="Photo URL"
                    value={u}
                    onChange={e=>{
                      const a = [...photos]; a[i]=e.target.value; setPhotos(a);
                    }}
                    style={{ textAlign: 'left' }}
                  />
                ))}
                <button
                  type="button"
                  onClick={()=>setPhotos(ps=>[...ps,''])}
                  className="text-sm text-blue-600 mb-2"
                >
                  + Add photo
                </button>
                <br/>
                <button className="px-4 py-2 bg-green-600 text-white rounded">Event</button>
              </form>
            )}
            {events.map(ev => (
              <div key={ev.id} className="border p-4 rounded mb-6 bg-white shadow-sm" style={{ textAlign: 'left' }}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-bold">{ev.title}</h3>
                  <span className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(ev.createdAt))} ago
                  </span>
                </div>
                <p>{ev.description}</p>
                {ev.dateFilter && (
                  <p><strong>Date:</strong> {new Date(ev.dateFilter).toLocaleDateString()}</p>
                )}
                {ev.location && <p><strong>Location:</strong> {ev.location}</p>}
                {ev.photos?.map((u,i)=>(
                  <img key={i} src={u} alt="" className="w-full max-h-48 object-cover rounded my-2"/>
                ))}
                <RSVPButtons eventId={ev.id}/>
                <ReactionButtons entityType="event" entityId={ev.id}/>
                <Comments parentType="events" parentId={ev.id}/>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );

  // --- Handler Functions for Creation ---

  async function handleCreatePost(e) {
    e.preventDefault();
    if (!newTitle.trim()) return toast.warn('Title required');
    try {
      await axios.post(
        `${API_URL}/posts`,
        { title: newTitle, description: newDesc, image: newImage },
        { headers: await authHeaders() }
      );
      toast.success('Post created');
      setNewTitle(''); setNewDesc(''); setNewImage('');
      fetchPosts();
    } catch {
      toast.error('Post failed');
    }
  }

  async function handleCreateEvent(e) {
    e.preventDefault();
    if (!title.trim()) return toast.warn('Title required');
    try {
      await axios.post(
        `${API_URL}/events`,
        { title, description: desc, dateFilter, location, photos: photos.filter(u=>u) },
        { headers: await authHeaders() }
      );
      toast.success('Event created');
      setTitle(''); setDesc(''); setDateFilter(''); setLocation(''); setPhotos(['']);
      fetchEvents();
    } catch {
      toast.error('Event failed');
    }
  }
}
