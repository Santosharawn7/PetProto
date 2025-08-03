// components/community/CommunityCommon.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';

export const API_URL = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || 'http://127.0.0.1:5000';
export const EMOJIS = { like: '👍', love: '❤️', haha: '😂', sad: '😢' };

// Reaction Buttons
export function ReactionButtons({ entityType, entityId, user, authHeaders }) {
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
}

// Comments (threaded)
export function Comments({ parentType, parentId, user, authHeaders }) {
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
            {user && (
              <button 
                onClick={() => setReplyTo(c.id)} 
                className="text-blue-600 hover:text-blue-800"
              >
                Reply
              </button>
            )}
            <ReactionButtons entityType="comment" entityId={c.id} user={user} authHeaders={authHeaders} />
          </div>
          {renderThread(c.id, depth + 1)}
        </div>
      ));

  return (
    <div className="mt-4 pt-4 text-left">
      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">Comments</h4>
      {renderThread(null)}
      {user && (
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
      )}
    </div>
  );
}

// RSVP Buttons for events
export function RSVPButtons({ eventId, user, authHeaders }) {
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
}
