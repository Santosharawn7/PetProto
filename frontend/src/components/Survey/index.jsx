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
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow mt-6">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold whitespace-nowrap">~Tell Us About Your Pet~</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q, idx) => (
          <div key={idx}>
            <label className="block text-base font-medium mb-1">{q}</label>
            <textarea
              value={responses[q]}
              onChange={e => handleChange(q, e.target.value)}
              className="w-full p-2 border rounded h-24"
              required
            />
          </div>
        ))}

        <div className="flex flex-col sm:flex-row sm:space-x-4 justify-center">
          <button
            onClick={() => navigate('/home')}
            className="mt-4 bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-900"
          >
            Home
          </button>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-800"
          >
            {loading ? 'Saving…' : 'See Matches'}
          </button>
          <button
            type="button"
            onClick={handleProceed}
            className="mt-4 bg-red-600 text-white px-6 py-2 rounded hover:bg-red-900"
          >
            Proceed Without Answering
          </button>
        </div>
      </form>
    </div>
  );
}
