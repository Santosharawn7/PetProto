// components/community/Community.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { auth } from '../../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

import { API_URL } from '../../config/CommunityCommon';
import AllEvents from '../AllEvents';
import PostsTab from '../Posts';
import EventsTab from '../Events';

export default function CommunityPage() {
  const [user, loading] = useAuthState(auth);
  const [tab, setTab] = useState('all');
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Form states
  const [showPostForm, setShowPostForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Post form fields
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImage, setNewImage] = useState('');

  // Event form fields
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [location, setLocation] = useState('');
  const [photos, setPhotos] = useState(['']);

  // UI states
  const [openComments, setOpenComments] = useState({});
  const [showDropdown, setShowDropdown] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState({});
  const dropdownRefs = useRef({});

  // Auth headers
  const authHeaders = async () => {
    if (!user) return {};
    try {
      const token = await user.getIdToken();
      return { Authorization: `Bearer ${token}` };
    } catch {
      return {};
    }
  };

  // Fetch posts & events
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

  // Click outside for dropdown
  useEffect(() => {
    const handleClick = (e) => {
      Object.keys(showDropdown).forEach((key) => {
        if (showDropdown[key] && dropdownRefs.current[key] && !dropdownRefs.current[key].contains(e.target)) {
          setShowDropdown((prev) => ({ ...prev, [key]: false }));
        }
      });
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);

  // Tabs config
  const getAvailableTabs = () => {
    const tabs = [{ key: 'all', label: 'All' }];
    if (user) {
      tabs.push({ key: 'posts', label: 'Posts' });
      tabs.push({ key: 'events', label: 'Events' });
    }
    return tabs;
  };

  // Author helper
  const isAuthor = (item) => user && (item.author === user.uid);

  // ---- Edit/Delete logic ----
  const handleEdit = (item) => {
    setIsEdit(true);
    setEditItem(item);
    if (item.__type === 'post') {
      setNewTitle(item.title || '');
      setNewDesc(item.description || '');
      setNewImage(item.image || '');
      setShowPostForm(true);
    } else {
      setTitle(item.title || '');
      setDesc(item.description || '');
      setDateFilter(item.dateFilter ? item.dateFilter.slice(0, 10) : '');
      setLocation(item.location || '');
      setPhotos(item.photos && item.photos.length ? item.photos : ['']);
      setShowEventForm(true);
    }
  };

  const handleDelete = async (item) => {
    if (!user) return toast.error('Sign in!');
    const headers = await authHeaders();
    try {
      if (item.__type === 'post') {
        await axios.delete(`${API_URL}/posts/${item.id}`, { headers });
        fetchPosts();
        toast.success('Post deleted!');
      } else {
        await axios.delete(`${API_URL}/events/${item.id}`, { headers });
        fetchEvents();
        toast.success('Event deleted!');
      }
      setShowDeleteModal(prev => ({ ...prev, [item.__type + '-' + item.id]: false }));
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  // ---- Forms ----
  async function handleCreatePost(e) {
    e.preventDefault();
    if (!newTitle.trim()) return toast.warn('Title required');
    if (!user) return toast.error('Please sign in to create posts');
    try {
      if (isEdit && editItem) {
        // Edit
        await axios.put(
          `${API_URL}/posts/${editItem.id}`,
          { title: newTitle, description: newDesc, image: newImage },
          { headers: await authHeaders() }
        );
        toast.success('Post updated!');
      } else {
        // New
        await axios.post(
          `${API_URL}/posts`,
          { title: newTitle, description: newDesc, image: newImage },
          { headers: await authHeaders() }
        );
        toast.success('Post created!');
      }
      setNewTitle(''); setNewDesc(''); setNewImage('');
      setIsEdit(false); setEditItem(null);
      setShowPostForm(false);
      fetchPosts();
    } catch (error) {
      toast.error('Failed to create/update post');
    }
  }

  async function handleCreateEvent(e) {
    e.preventDefault();
    if (!title.trim()) return toast.warn('Title required');
    if (!user) return toast.error('Please sign in to create events');
    try {
      if (isEdit && editItem) {
        // Edit
        await axios.put(
          `${API_URL}/events/${editItem.id}`,
          { 
            title, 
            description: desc, 
            dateFilter, 
            location, 
            photos: photos.filter(u => u.trim())
          },
          { headers: await authHeaders() }
        );
        toast.success('Event updated!');
      } else {
        // New
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
        toast.success('Event created!');
      }
      setTitle(''); setDesc(''); setDateFilter(''); setLocation(''); setPhotos(['']);
      setIsEdit(false); setEditItem(null);
      setShowEventForm(false);
      fetchEvents();
    } catch (error) {
      toast.error('Failed to create/update event');
    }
  }

  // ---- RENDER ----
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
        <div className="flex space-x-1 mb-6 border-b-2 border-gray-700 overflow-x-auto text-left">
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

        {tab === 'all' && (
          <AllEvents
            user={user}
            posts={posts}
            events={events}
            openComments={openComments}
            setOpenComments={setOpenComments}
            showDropdown={showDropdown}
            setShowDropdown={setShowDropdown}
            showDeleteModal={showDeleteModal}
            setShowDeleteModal={setShowDeleteModal}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            dropdownRefs={dropdownRefs}
            isAuthor={isAuthor}
            authHeaders={authHeaders}
          />
        )}

        {tab === 'posts' && user && (
          <PostsTab
            user={user}
            posts={posts}
            openComments={openComments}
            setOpenComments={setOpenComments}
            showDropdown={showDropdown}
            setShowDropdown={setShowDropdown}
            showDeleteModal={showDeleteModal}
            setShowDeleteModal={setShowDeleteModal}
            isAuthor={isAuthor}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            dropdownRefs={dropdownRefs}
            showPostForm={showPostForm}
            setShowPostForm={setShowPostForm}
            isEdit={isEdit}
            setIsEdit={setIsEdit}
            setEditItem={setEditItem}
            newTitle={newTitle}
            setNewTitle={setNewTitle}
            newDesc={newDesc}
            setNewDesc={setNewDesc}
            newImage={newImage}
            setNewImage={setNewImage}
            handleCreatePost={handleCreatePost}
            authHeaders={authHeaders}
          />
        )}

        {tab === 'events' && user && (
          <EventsTab
            user={user}
            events={events}
            openComments={openComments}
            setOpenComments={setOpenComments}
            showDropdown={showDropdown}
            setShowDropdown={setShowDropdown}
            showDeleteModal={showDeleteModal}
            setShowDeleteModal={setShowDeleteModal}
            isAuthor={isAuthor}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            dropdownRefs={dropdownRefs}
            showEventForm={showEventForm}
            setShowEventForm={setShowEventForm}
            isEdit={isEdit}
            setIsEdit={setIsEdit}
            setEditItem={setEditItem}
            title={title}
            setTitle={setTitle}
            desc={desc}
            setDesc={setDesc}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            location={location}
            setLocation={setLocation}
            photos={photos}
            setPhotos={setPhotos}
            handleCreateEvent={handleCreateEvent}
            authHeaders={authHeaders}
          />
        )}
      </div>
    </div>
  );
}
