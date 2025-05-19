import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Helper to compute age from dob string ("YYYY-MM-DD")
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

export default function PetProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [petProfile, setPetProfile] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
      return;
    }
    axios.get('http://127.0.0.1:5000/current_user', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setPetProfile(res.data.petProfile || null);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setPetProfile(null);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) {
    return <p className="p-6 text-center">Loading pet profile…</p>;
  }

  if (!petProfile) {
    return (
      <div className="p-6 text-center">
        <p>No pet profile found.</p>
        <button
          onClick={() => navigate('/edit-pet')}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Profile
        </button>
      </div>
    );
  }

  // Compute pet age
  const age = getPetAge(petProfile.dob);

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50">
      <div className="max-w-3xl w-full mx-auto p-6 bg-white rounded shadow">
        <h2 className="text-center text-3xl font-bold mb-6">Your Pet Profile</h2>
        {petProfile.image && (
          <img
            src={petProfile.image}
            alt={petProfile.name}
            className="w-32 h-32 object-cover rounded mx-auto mb-4"
          />
        )}
        <p className="mb-2"><strong>Name:</strong> {petProfile.name}</p>
        <p className="mb-2"><strong>Species:</strong> {petProfile.species}</p>
        <p className="mb-2"><strong>Breed:</strong> {petProfile.breed}</p>
        <p className="mb-2"><strong>Sex:</strong> {petProfile.sex}</p>
        <p className="mb-2"><strong>Colour:</strong> {petProfile.colour}</p>
        <p className="mb-2"><strong>Location:</strong> {petProfile.location}</p>
        <p className="mb-2">
          <strong>Age:</strong>{" "}
          {age !== null ? `${age} year${age === 1 ? "" : "s"}` : "N/A"}
        </p>
        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={() => navigate('/edit-pet')}
            className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Edit
          </button>
          <button
            onClick={() => navigate('/home')}
            className="py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
