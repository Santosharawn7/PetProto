import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

// Helper: compute years from dob ("YYYY-MM-DD")
function getPetAge(dob) {
  if (!dob) return null;
  const dobDate = new Date(dob);
  if (isNaN(dobDate.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dobDate.getFullYear();
  const m = now.getMonth() - dobDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dobDate.getDate())) {
    age--;
  }
  return age;
}

const MatchPetProfile = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const match = state?.match;

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [chatId, setChatId] = useState(null);

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
  const petAge = getPetAge(p.dob);

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
    <div className="flex items-center justify-center p-8">
      <div className="w-full max-w-7xl bg-white border border-gray-300 rounded-3xl shadow-xl flex flex-col md:flex-row overflow-hidden">
        
        {/* Left: Image */}
        <div className="md:w-3xl w-full flex items-center justify-center">
          {p.image && (
            <img
              src={p.image}
              alt={p.name}
              className="object-cover w-full h-full"
            />
          )}
        </div>

        {/* Right: Info */}
        <div className="md:w-1/2 w-full p-10 flex flex-col justify-between">
          <div>
            {/* Pet Name */}
            <h2 className="text-5xl font-extrabold text-gray-800 mb-6 text-left">{p.name}</h2>

            {/* Key Info */}
            <div className="text-lg text-gray-700 mb-6 space-y-2 text-left">
              <p><strong className="mr-2">Species:</strong> {p.species}</p>
              <p><strong className="mr-2">Breed:</strong> {p.breed}</p>
              <p><strong className="mr-2">Sex:</strong> {p.sex}</p>
              <p><strong className="mr-2">Colour:</strong> {p.colour}</p>
              <p><strong className="mr-2">Age:</strong> {petAge !== null ? `${petAge} year${petAge === 1 ? '' : 's'}` : 'N/A'}</p>
              <p><strong className="mr-2">Location:</strong> {p.location}</p>
            </div>

            {/* Divider */}
            <hr className="border-t border-gray-300 my-6" />

            {/* Match Score Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div className="text-gray-800 font-bold space-y-2 text-lg text-left">
                <p>Pet Match Score: <span className=" text-purple-600"> {petScore}</span></p>
                <p>Personality Match Score:<span className=" text-orange-600"> {personalityScore.toFixed(1)}</span></p>
              </div>
              <div className="mt-8 mr-5 sm:mt-0 sm:ml-8">
                <div className="w-27 h-27 flex items-center justify-center rounded-full border-7 border-green-500 border-double bg-green-100 text-green-700 font-bold text-xl shadow-md text-center">
                  Total<br />{totalScore.toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          {/* Capsules for showing the personality of the pets, should draw data from backend */}
          <div className="flex flex-wrap justify-center gap-4 mt-4 mb-10">
            {(p.characteristics && p.characteristics.length > 0) ? (
              p.characteristics.map(char => (
                <span
                  key={char}
                  className="px-8 py-2 bg-blue-200 text-blue-900 rounded-full font-bold border-4 border-dotted text-lg shadow"
                >
                  {char}
                </span>
              ))
            ) : (
              <span className="text-gray-400">No characteristics listed</span>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <button
              onClick={() => navigate('/home')}
              className="px-6 py-3 bg-gray-600 font-bold text-white rounded-full hover:bg-gray-900 transition duration-200"
            >
              Back to Home
            </button>

            {chatId ? (
              <button
                onClick={handleMessage}
                className="px-6 py-3 font-bold bg-green-600 text-white rounded-full hover:bg-green-900 transition duration-200"
              >
                Message
              </button>
            ) : (
              <button
                onClick={handleSendRequest}
                disabled={sending || sent}
                className={`px-6 py-3 font-bold rounded-full text-white transition duration-200 ${
                  sent
                    ? 'bg-gray-500 cursor-default'
                    : 'bg-blue-600 hover:bg-blue-900'
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
