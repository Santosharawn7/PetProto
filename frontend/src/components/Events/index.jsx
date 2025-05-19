import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { auth } from '../../firebase';
import { formatDistanceToNow } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
const EMOJIS = { like: '👍', love: '❤️', haha: '😂', sad: '😢' };

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Event Modal State
  const [showCreate, setShowCreate] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [location, setLocation] = useState('');
  const [photos, setPhotos] = useState(['']);

  const authHeaders = async () => {
    const t = await auth.currentUser.getIdToken();
    return { Authorization: `Bearer ${t}` };
  };

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API_URL}/events`, { headers: await authHeaders() });
      setEvents(res.data.events || []);
    } catch {
      toast.error('Could not load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleCreate = async e => {
    e.preventDefault();
    if (!title.trim()) return toast.warn('Title required');
    try {
      await axios.post(
        `${API_URL}/events`,
        { title, description: desc, dateFilter, location, photos: photos.filter(u => u) },
        { headers: await authHeaders() }
      );
      toast.success('Event created');
      setTitle(''); setDesc(''); setDateFilter(''); setLocation(''); setPhotos(['']);
      setShowCreate(false); // Hide after creation
      fetchEvents();
    } catch {
      toast.error('Event failed');
    }
  };

  const ReactionButtons = ({ entityId }) => {
    const [counts, setCounts] = useState({});
    const fetchR = async () => {
      const res = await axios.get(
        `${API_URL}/reactions?entityType=event&entityId=${entityId}`,
        { headers: await authHeaders() }
      );
      const c = {};
      res.data.reactions.forEach(r => (c[r.type] = (c[r.type]||0)+1));
      setCounts(c);
    };
    useEffect(() => { fetchR(); }, [entityId]);
    const react = async type => {
      await axios.post(
        `${API_URL}/reactions`,
        { entityType: 'event', entityId, type },
        { headers: await authHeaders() }
      );
      fetchR();
    };
    return (
      <div className="flex space-x-3 mt-2">
        {Object.entries(EMOJIS).map(([t,e]) => (
          <button key={t} onClick={()=>react(t)} className="px-2 py-1 bg-gray-100 rounded-full">
            {e}<span className="ml-1 text-sm">{counts[t]||0}</span>
          </button>
        ))}
      </div>
    );
  };

  // RSVP section: gets your RSVP and RSVP summary from backend
  const RSVPButtons = ({ eventId }) => {
    const [status, setStatus] = useState(null);
    const [summary, setSummary] = useState({yes: [], no: [], maybe: []});
    const [userId, setUserId] = useState('');

    // Fetch your RSVP and summary
    const fetchRSVP = async () => {
      const t = await auth.currentUser.getIdToken();
      const uid = auth.currentUser.uid;
      setUserId(uid);
      try {
        const res = await axios.get(`${API_URL}/events/${eventId}/rsvps`, { headers: { Authorization: `Bearer ${t}` } });
        const rsvps = res.data.rsvps || [];
        const yours = rsvps.find(r => r.user === uid);
        setStatus(yours ? yours.status : null);

        // Build summary
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

  // Comments section for events, improved left-aligned & threaded
  const Comments = ({ eventId }) => {
    const [comments, setComments] = useState([]);
    const [text, setText] = useState('');
    const [replyTo, setReplyTo] = useState(null);

    const fetchComments = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/events/${eventId}/comments`,
          { headers: await authHeaders() }
        );
        setComments(res.data.comments || []);
      } catch {/* ignore */}
    };

    useEffect(() => { fetchComments(); }, [eventId]);

    const submit = async e => {
      e.preventDefault();
      if (!text.trim()) return;
      try {
        await axios.post(
          `${API_URL}/events/${eventId}/comments`,
          { text, parentCommentId: replyTo || undefined },
          { headers: await authHeaders() }
        );
        setText(''); setReplyTo(null);
        fetchComments();
      } catch {
        toast.error('Could not post comment');
      }
    };

    const renderThread = (pid, depth = 0) =>
      comments.filter(c => (c.parentCommentId||null) === pid).map(c => (
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
            <ReactionButtons entityId={c.id} />
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
              <button type="button" onClick={() => setReplyTo(null)} className="underline">
                Cancel
              </button>
            </div>
          )}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
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

  if (loading) return <p className="p-4 text-center">Loading events…</p>;

  return (
    <div>
      <button
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded"
        onClick={() => setShowCreate(sc => !sc)}
      >
        {showCreate ? "Close New Event" : "New Event"}
      </button>
      {showCreate && (
        <form onSubmit={handleCreate} className="mb-6 p-4 border rounded" style={{ textAlign: 'left' }}>
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

      {/* List */}
      {events.map(ev => (
        <div key={ev.id} className="mb-6 p-2 border rounded bg-white shadow-sm" style={{ textAlign: 'left' }}>
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"/>
            <div>
              <p className="font-semibold">{ev.authorName || ev.author}</p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(ev.createdAt))} ago
              </p>
            </div>
          </div>
          <h3 className="font-bold">{ev.title}</h3>
          <p className="mt-1">{ev.description}</p>
          {ev.dateFilter && (
            <p className="mt-1"><strong>Date:</strong> {new Date(ev.dateFilter).toLocaleDateString()}</p>
          )}
          {ev.location && (
            <p className="mt-1"><strong>Location:</strong> {ev.location}</p>
          )}
          {ev.photos?.map((u,i) => (
            <img key={i} src={u} alt="" className="w-full my-2 rounded"/>
          ))}
          <RSVPButtons eventId={ev.id}/>
          <ReactionButtons entityId={ev.id}/>
          <Comments eventId={ev.id} />
        </div>
      ))}
      {events.length===0 && <p className="text-center text-gray-600">No events yet.</p>}
    </div>
  );
}
