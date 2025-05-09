// src/components/CommunityPage/index.jsx
import React, { useState, useEffect, useRef } from 'react';
import Header from '../Header';
import axios from 'axios';
import { toast } from 'react-toastify';
import { auth } from '../../firebase';
import { formatDistanceToNow } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

// Emoji map for reactions
const EMOJIS = {
  like: '👍',
  love: '❤️',
  haha: '😂',
  sad: '😢'
};

export default function CommunityPage() {
  const [events, setEvents] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [loading, setLoading] = useState(true);
  const lastFetchedRef = useRef(null);

  // fetch events
  const fetchEvents = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await axios.get(`${API_URL}/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const evs = res.data.events || [];
      if (lastFetchedRef.current) {
        const oldIds = new Set(lastFetchedRef.current.map(e => e.id));
        evs.forEach(e => {
          if (!oldIds.has(e.id)) {
            toast.info(`New event: ${e.title}`);
          }
        });
      }
      lastFetchedRef.current = evs;
      setEvents(evs);
    } catch (err) {
      console.error('Failed to load events', err);
      toast.error('Could not load community events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const iv = setInterval(fetchEvents, 15000);
    return () => clearInterval(iv);
  }, []);

  // create event
  const handleCreate = async e => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.warn('Title is required');
      return;
    }
    try {
      const token = await auth.currentUser.getIdToken();
      await axios.post(
        `${API_URL}/events`,
        { title: newTitle, description: newDesc },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Event created!');
      setNewTitle('');
      setNewDesc('');
      fetchEvents();
    } catch (err) {
      console.error('Create event failed', err);
      toast.error('Could not create event');
    }
  };

  // Reaction buttons using emojis
  const ReactionButtons = ({ entityType, entityId }) => {
    const [reactions, setReactions] = useState({});
    const fetchReactions = async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await axios.get(
          `${API_URL}/reactions?entityType=${entityType}&entityId=${entityId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const counts = {};
        res.data.reactions.forEach(r => {
          counts[r.type] = (counts[r.type] || 0) + 1;
        });
        setReactions(counts);
      } catch {
        // ignore
      }
    };
    useEffect(() => {
      fetchReactions();
    }, [entityType, entityId]);

    const handleReact = async type => {
      try {
        const token = await auth.currentUser.getIdToken();
        await axios.post(
          `${API_URL}/reactions`,
          { entityType, entityId, type },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchReactions();
      } catch {
        toast.error('Could not send reaction');
      }
    };

    return (
      <div className="flex space-x-3 items-center mt-2">
        {Object.keys(EMOJIS).map(type => (
          <button
            key={type}
            onClick={() => handleReact(type)}
            className="px-2 py-1 bg-gray-100 rounded-full hover:bg-gray-200 flex items-center"
            title={type}
          >
            <span className="text-xl">{EMOJIS[type]}</span>
            <span className="ml-1 text-sm">{reactions[type] || 0}</span>
          </button>
        ))}
      </div>
    );
  };

  // Comments component
  const Comments = ({ eventId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState(null);

    const fetchComments = async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await axios.get(
          `${API_URL}/events/${eventId}/comments`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setComments(res.data.comments || []);
      } catch {
        // ignore
      }
    };
    useEffect(() => {
      fetchComments();
    }, [eventId]);

    const handleSubmit = async e => {
      e.preventDefault();
      if (!newComment.trim()) return;
      try {
        const token = await auth.currentUser.getIdToken();
        await axios.post(
          `${API_URL}/events/${eventId}/comments`,
          { text: newComment, parentCommentId: replyTo || undefined },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setNewComment('');
        setReplyTo(null);
        fetchComments();
      } catch {
        toast.error('Could not post comment');
      }
    };

    const renderThread = parentId =>
      comments
        .filter(c => (c.parentCommentId || null) === parentId)
        .map(c => (
          <div key={c.id} className={`${parentId ? 'pl-8' : ''} py-2`}>
            <p>
              <strong>{c.author}</strong> ·{' '}
              {formatDistanceToNow(new Date(c.createdAt))} ago
            </p>
            <p>{c.text}</p>
            <div className="flex space-x-4 text-sm mt-1">
              <button
                onClick={() => setReplyTo(c.id)}
                className="text-blue-600"
              >
                Reply
              </button>
              <ReactionButtons entityType="comment" entityId={c.id} />
            </div>
            {renderThread(c.id)}
          </div>
        ));

    return (
      <div className="mt-4">
        {renderThread(null)}
        <form onSubmit={handleSubmit} className="mt-2 flex space-x-2">
          {replyTo && (
            <div className="text-sm text-gray-600">
              Replying…{' '}
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="underline"
              >
                Cancel
              </button>
            </div>
          )}
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            className="flex-1 p-2 border rounded"
            rows={2}
            placeholder="Add a comment…"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Post
          </button>
        </form>
      </div>
    );
  };

  if (loading) {
    return <p className="p-6 text-center">Loading community…</p>;
  }

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <h2 className="text-2xl font-semibold">Community Events</h2>

        {/* Create event */}
        <form onSubmit={handleCreate} className="space-y-2 border p-4 rounded">
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Event Title"
            className="w-full p-2 border rounded"
            required
          />
          <textarea
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full p-2 border rounded"
            rows={3}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Create Event
          </button>
        </form>

        {/* Events list */}
        {events.map(ev => (
          <div key={ev.id} className="border p-4 rounded space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">{ev.title}</h3>
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(ev.createdAt))} ago
              </span>
            </div>
            <p>{ev.description}</p>
            <ReactionButtons entityType="event" entityId={ev.id} />
            <Comments eventId={ev.id} />
          </div>
        ))}
      </div>
    </>
  );
}
