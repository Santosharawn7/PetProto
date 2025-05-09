// src/components/Survey/SurveyPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import {
  doc,
  collection,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';

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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Pre-fill any existing answers
  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    getDoc(
      doc(db, 'users', uid, 'surveyResponses', 'sentimentSurvey')
    ).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.responses) {
          setResponses(data.responses);
        }
      }
    }).catch(err => {
      console.error('Failed to load existing survey:', err);
    });
  }, []);

  const handleChange = (q, value) => {
    setResponses(prev => ({ ...prev, [q]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Please log in to submit your pet survey.');

      const uid = user.uid;

      // Overwrite the single sentimentSurvey doc
      await setDoc(
        doc(collection(db, 'users', uid, 'surveyResponses'), 'sentimentSurvey'),
        { questions, responses, createdAt: serverTimestamp() },
        { merge: false }
      );

      // Also merge into the main user doc
      await setDoc(
        doc(db, 'users', uid),
        { sentimentResponses: responses },
        { merge: true }
      );

      // Navigate home so matching picks up new data
      navigate('/home');
    } catch (err) {
      console.error('Survey save failed:', err);
      alert(err.message || 'Failed to submit survey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    if (window.confirm("Are you sure you don't want to answer and proceed ahead?")) {
      navigate('/home');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Tell us about your pet</h2>
        <button
          onClick={() => navigate('/home')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Home
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q, idx) => (
          <div key={idx}>
            <label className="block text-sm font-medium mb-1">{q}</label>
            <textarea
              value={responses[q]}
              onChange={e => handleChange(q, e.target.value)}
              className="w-full p-2 border rounded h-24"
              required
            />
          </div>
        ))}

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
          >
            {loading ? 'Saving…' : 'See Matches'}
          </button>
          <button
            type="button"
            onClick={handleProceed}
            className="mt-4 bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
          >
            Proceed Without Answering
          </button>
        </div>
      </form>
    </div>
  );
}
