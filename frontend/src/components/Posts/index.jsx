import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { auth } from '../../firebase';
import { formatDistanceToNow } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
const EMOJIS = { like: '👍', love: '❤️', haha: '😂', sad: '😢' };

export default function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Post Modal State
  const [showCreate, setShowCreate] = useState(false);

  // Form fields
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImage, setNewImage] = useState('');

  const authHeaders = async () => {
    const t = await auth.currentUser.getIdToken();
    return { Authorization: `Bearer ${t}` };
  };

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API_URL}/posts`, { headers: await authHeaders() });
      setPosts(res.data.posts || []);
    } catch {
      toast.error('Could not load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleCreate = async e => {
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
      setShowCreate(false); // Hide after creation
      fetchPosts();
    } catch {
      toast.error('Post failed');
    }
  };

  const ReactionButtons = ({ entityId }) => {
    const [counts, setCounts] = useState({});
    const fetchR = async () => {
      const res = await axios.get(
        `${API_URL}/reactions?entityType=post&entityId=${entityId}`,
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
        { entityType: 'post', entityId, type },
        { headers: await authHeaders() }
      );
      fetchR();
    };
    return (
      <div className="flex space-x-3 mt-2">
        {Object.entries(EMOJIS).map(([t, e]) => (
          <button key={t} onClick={() => react(t)} className="px-2 py-1 bg-gray-100 rounded-full">
            {e}<span className="ml-1 text-sm">{counts[t]||0}</span>
          </button>
        ))}
      </div>
    );
  };

  // Comments section with improved left orientation & thread borders
  const Comments = ({ postId }) => {
    const [comments, setComments] = useState([]);
    const [text, setText] = useState('');
    const [replyTo, setReplyTo] = useState(null);

    const fetchComments = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/posts/${postId}/comments`,
          { headers: await authHeaders() }
        );
        setComments(res.data.comments || []);
      } catch {/* ignore */}
    };

    useEffect(() => { fetchComments(); }, [postId]);

    const submit = async e => {
      e.preventDefault();
      if (!text.trim()) return;
      try {
        await axios.post(
          `${API_URL}/posts/${postId}/comments`,
          { text, parentCommentId: replyTo || undefined },
          { headers: await authHeaders() }
        );
        setText(''); setReplyTo(null);
        fetchComments();
      } catch {
        toast.error('Could not post comment');
      }
    };

    // thread styling: border-l and extra margin for replies
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

  if (loading) return <p className="p-4 text-center">Loading posts…</p>;

  return (
    <div>
      <button
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded"
        onClick={() => setShowCreate(sc => !sc)}
      >
        {showCreate ? "Close New Post" : "New Post"}
      </button>
      {showCreate && (
        <form onSubmit={handleCreate} className="mb-6 p-4 border rounded" style={{ textAlign: 'left' }}>
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

      {/* List */}
      {posts.map(p => (
        <div key={p.id} className="mb-6 p-2 border rounded bg-white shadow-sm" style={{ textAlign: 'left' }}>
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"/>
            <div>
              <p className="font-semibold">{p.authorName || p.author}</p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(p.createdAt))} ago
              </p>
            </div>
          </div>
          <h3 className="font-bold">{p.title}</h3>
          {p.image && <img src={p.image} alt="" className="w-full my-2 rounded"/>}
          <p className="text-gray-700">{p.description}</p>
          <ReactionButtons entityId={p.id}/>
          <Comments postId={p.id} />
        </div>
      ))}
      {posts.length === 0 && <p className="text-center text-gray-600">No posts yet.</p>}
    </div>
  );
}
