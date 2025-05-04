// src/components/Survey/SurveyPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MatchingCarousel from '../MatchingCarousel';
import { auth } from '../../firebase';
import { getFirestore, doc, collection, setDoc, serverTimestamp } from 'firebase/firestore';

// Initialize Firestore
const db = getFirestore();

// Predefined sentiment questions
const questions = [
  "What is your pet's favorite game or toy?",
  "How does your pet like to spend a rainy day?",
  "Where does your pet love to go on outings?",
  "What outdoor activity does your pet enjoy the most?",
  "How does your pet react to meeting new animals?",
  "What tricks or commands does your pet love performing?",
  "What is your pet's preferred way to exercise?",
  "How does your pet feel about water-based activities?",
  "What treat or snack time activity does your pet look forward to?",
  "How does your pet like to relax or unwind after playtime?"
];

export default function SurveyPage() {
  const [responses, setResponses] = useState(
    questions.reduce((acc, q) => ({ ...acc, [q]: '' }), {})
  );
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (q, value) => {
    setResponses(prev => ({ ...prev, [q]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const user = auth.currentUser;
    if (!user) {
      alert('Please log in to submit your pet survey.');
      setLoading(false);
      return;
    }

    try {
      // Save responses to a dedicated survey document under the user's subcollection
      const surveyRef = doc(
        collection(db, 'users', user.uid, 'surveyResponses'),
        'sentimentSurvey'
      );
      await setDoc(surveyRef, {
        questions,
        responses,
        createdAt: serverTimestamp()
      });

      // Also merge sentimentResponses on user document for quick access
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { sentimentResponses: responses }, { merge: true });

      // Fetch matches from backend
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.REACT_APP_API_URL}/sentiment-matches`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      setMatches(data.matches || []);
    } catch (err) {
      console.error('Survey submission error:', err);
      alert('Failed to submit survey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    const confirmed = window.confirm(
      "Are you sure you don't want to answer and proceed ahead?"
    );
    if (confirmed) {
      navigate('/home');
    }
  };

  // Display matches if loaded
  if (matches) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Personality Matches</h2>
        <MatchingCarousel
          matches={matches}
          onMatchClick={(u) => navigate(`/profile/${u.uid}`)}
        />
      </div>
    );
  }

  // Otherwise, survey form
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Tell us about your pet</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q, idx) => (
          <div key={idx}>
            <label className="block text-sm font-medium mb-1">{q}</label>
            <textarea
              value={responses[q]}
              onChange={(e) => handleChange(q, e.target.value)}
              className="w-full p-2 border rounded h-24"
              required
            />
          </div>
        ))}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition"
          >
            {loading ? 'Matching...' : 'See Matches'}
          </button>
          <button
            type="button"
            onClick={handleProceed}
            className="mt-4 bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition"
          >
            Proceed Without Answering
          </button>
        </div>
      </form>
    </div>
  );
}
