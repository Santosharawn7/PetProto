import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || 'http://127.0.0.1:5000';

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
  const { userId } = useParams();

  // State for dynamic profile loading
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [chatId, setChatId] = useState(null);

  // If state.match provided (navigation from matches list), use it as fallback
  useEffect(() => {
    let isMounted = true;
    async function fetchProfile() {
      setLoading(true);
      try {
        const token = localStorage.getItem('userToken');
        let profileData = null;

        if (userId) {
          // Fetch from backend by userId
          const res = await axios.get(`${API_URL}/user/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          profileData = res.data.match || res.data.petProfile || res.data; // backend may return different keys
        } else if (state?.match) {
          // Fallback to state.match (legacy)
          profileData = state.match;
        }

        if (isMounted) setProfile(profileData);
      } catch (err) {
        console.error('Failed to load profile:', err);
        if (isMounted) setProfile(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchProfile();
    return () => { isMounted = false; };
  }, [userId, state]);

  // Chat polling (if profile present)
  useEffect(() => {
    if (!profile || !profile.uid) return;
    let interval;
    const loadChat = async () => {
      try {
        const token = localStorage.getItem('userToken');
        const res = await axios.get(`${API_URL}/chats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const chats = res.data.chats || [];
        const existing = chats.find(c =>
          Array.isArray(c.participants) && c.participants.includes(profile.uid)
        );
        if (existing && existing.id !== chatId) {
          setChatId(existing.id);
        }
      } catch (err) {
        // Ignore errors for polling
      }
    };
    loadChat();
    interval = setInterval(loadChat, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [profile, chatId]);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p>Loading profile…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Profile not found.</p>
        <button
          onClick={() => navigate('/home')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Home
        </button>
      </div>
    );
  }

  // Use petProfile property if present, else profile directly
  const p = profile.petProfile || profile;
  const petScore = profile.petMatchScore ?? 0;
  const personalityScore = profile.sentimentMatchScore ?? 0;
  const totalScore = profile.finalMatchScore ?? petScore + personalityScore;
  const petAge = getPetAge(p.dob);

  const handleSendRequest = async () => {
    setSending(true);
    try {
      const token = localStorage.getItem('userToken');
      await axios.post(
        `${API_URL}/send-request`,
        { to: profile.uid, type: 'friend' },
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
    <div className="flex items-center justify-center mt-12">
      <div className="w-full max-w-5xl bg-white border border-gray-300 rounded-3xl shadow-xl flex flex-col md:flex-row overflow-hidden">
        
        {/* Left: Image */}
        <div className="md:w-3xl w-full flex items-center justify-center">
          {p.image && (
            <img
              src={p.image}
              alt={p.name}
              className=" md:w-[90%] md:h-[90%] rounded-3xl"
            />
          )}
        </div>

        {/* Right: Info */}
        <div className="md:w-1/2 w-full px-15 py-12 flex flex-col justify-between">
          <div>
            {/* Pet Name */}
            <h2 className="text-5xl font-extrabold text-gray-800 mb-6 text-left">{p.name}</h2>

            {/* Key Info */}
            <div className="text-lg text-gray-700 mb-6 space-y-2 text-left">
              <p className="whitespace-nowrap"><strong className="mr-2">Species:</strong> {p.species}</p>
              <p className="whitespace-nowrap"><strong className="mr-2">Breed:</strong> {p.breed}</p>
              <p className="whitespace-nowrap"><strong className="mr-2">Sex:</strong> {p.sex}</p>
              <p className="whitespace-nowrap"><strong className="mr-2">Colour:</strong> {p.colour}</p>
              <p className="whitespace-nowrap"><strong className="mr-2">Age:</strong> {petAge !== null ? `${petAge} year${petAge === 1 ? '' : 's'}` : 'N/A'}</p>
              <p className="whitespace-nowrap"><strong className="mr-2">Location:</strong> {p.location}</p>
            </div>

            {/* Divider */}
            <hr className="border-t-2 border-gray-800 border-solid my-8" />

            {/* Match Score Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div className="text-gray-800 font-bold space-y-2 text-lg text-left">
                <p>Pet Match Score: <span className=" text-purple-600"> {petScore}</span></p>
                <p className="whitespace-nowrap">Personality Match Score:<span className="flex-nowrap text-orange-600"> {personalityScore.toFixed(1)}</span></p>
              </div>
              <div className="mt-8 sm:mt-0 sm:ml-8 self-center text-center">
                <div className="w-38 h-38 sm:w-27 sm:h-27 flex items-center justify-center rounded-full border-10 sm:border-7 border-green-500 border-double bg-green-100 text-green-700 font-bold text-2xl sm:text-xl shadow-md text-center">
                  Total<br />{totalScore.toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          {/* Capsules for showing the personality of the pets, should draw data from backend */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10 mb-8">
              {(p.characteristics || []).map((char, idx) => (
                <span
                  key={char}
                  className={
                    "px-7 py-4 sm:px-6 sm:py-2 rounded-full font-bold border-4 border-dotted text-2xl sm:text-lg shadow " +
                    (idx === 0
                      ? "bg-blue-200 text-blue-900"
                      : idx === 1
                      ? "bg-green-200 text-green-900"
                      : idx === 2
                      ? "bg-purple-200 text-purple-900"
                      : "bg-gray-200 text-gray-900")
                  }
                >
                  {char}
                </span>
              ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between sm:mt-10">
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
