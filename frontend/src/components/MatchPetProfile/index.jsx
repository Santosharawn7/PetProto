// src/components/MatchPetProfile.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const MatchPetProfile = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const match = state?.match;

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [chatId, setChatId] = useState(null);

  // Poll for existing chat every 5s
  useEffect(() => {
    if (!match) return;
    let interval;
    const loadChat = async () => {
      try {
        const token = localStorage.getItem('userToken');
        const res = await axios.get(`${API_URL}/chats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const chats = res.data.chats || [];
        const existing = chats.find(c =>
          Array.isArray(c.participants) && c.participants.includes(match.uid)
        );
        if (existing && existing.id !== chatId) {
          setChatId(existing.id);
        }
      } catch (err) {
        console.error('Error loading chats', err);
      }
    };
    loadChat();
    interval = setInterval(loadChat, 5000);
    return () => clearInterval(interval);
  }, [match, chatId]);

  if (!match) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">No match data provided.</p>
        <button
          onClick={() => navigate('/home')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const p = match.petProfile || {};
  const petScore = match.petMatchScore ?? 0;
  const personalityScore = match.sentimentMatchScore ?? 0;
  const totalScore = match.finalMatchScore ?? petScore + personalityScore;

  const handleSendRequest = async () => {
    setSending(true);
    try {
      const token = localStorage.getItem('userToken');
      await axios.post(
        `${API_URL}/send-request`,
        { to: match.uid, type: 'friend' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Request sent!');
      setSent(true);
    } catch (err) {
      console.error('Send request error', err);
      toast.error(err.response?.data?.error || 'Failed to send request');
    } finally {
      setSending(false);
    }
  };

  const handleMessage = () => {
    navigate(`/chat/${chatId}`);
  };

  return (
    <div className="p-6 flex justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow overflow-hidden">
        {p.image && (
          <img
            src={p.image}
            alt={p.name}
            className="w-full h-64 object-cover"
          />
        )}
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">{p.name}</h2>
          <p className="mb-2"><strong>Species:</strong> {p.species}</p>
          <p className="mb-2"><strong>Breed:</strong> {p.breed}</p>
          <p className="mb-2"><strong>Sex:</strong> {p.sex}</p>
          <p className="mb-2"><strong>Colour:</strong> {p.colour}</p>
          <p className="mb-2"><strong>Location:</strong> {p.location}</p>

          <div className="mt-4 space-y-2">
            <p className="text-lg">
              <strong>Pet Match Score:</strong> {petScore}
            </p>
            <p className="text-lg">
              <strong>Personality Match Score:</strong> {personalityScore.toFixed(1)}
            </p>
            <p className="text-2xl font-semibold">
              <strong>Total Score:</strong> {totalScore.toFixed(1)}
            </p>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => navigate('/home')}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back to Home
            </button>

            {chatId ? (
              <button
                onClick={handleMessage}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Message
              </button>
            ) : (
              <button
                onClick={handleSendRequest}
                disabled={sending || sent}
                className={`px-4 py-2 rounded text-white ${
                  sent
                    ? 'bg-gray-500 cursor-default'
                    : 'bg-blue-600 hover:bg-blue-700'
                } ${sending ? 'opacity-50 cursor-wait' : ''}`}
              >
                {sent ? 'Request Sent' : sending ? 'Sending...' : 'Send Request'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchPetProfile;
