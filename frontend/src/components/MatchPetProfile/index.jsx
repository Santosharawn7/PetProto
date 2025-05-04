// src/MatchPetProfile.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const MatchPetProfile = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const match = state?.match;

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

          <button
            onClick={() => navigate('/home')}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchPetProfile;
