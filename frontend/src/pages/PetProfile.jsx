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
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col md:flex-row w-full max-w-5xl">
        
        {/* Left: Image */}
        <div className="md:w-1/2 bg-blue-50 flex items-center justify-center p-8">
          {petProfile.image ? (
            <img
              src={petProfile.image}
              alt={petProfile.name}
              className="w-88 h-88 object-cover rounded-2xl shadow-lg"
            />
          ) : (
            <div className="w-72 h-72 bg-gray-300 flex items-center justify-center text-gray-600 rounded-2xl">
              No Image
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="md:w-1/2 p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-6xl font-bold text-black mb-8">{petProfile.name}</h2>
            
            {/* Grid Info */}
            <div className="grid grid-cols-2 gap-4 text-black text-lg mb-6">
              <p><strong>Species:</strong> {petProfile.species}</p>
              <p><strong>Breed:</strong> {petProfile.breed}</p>
              <p><strong>Sex:</strong> {petProfile.sex}</p>
              <p><strong>Age:</strong> {age !== null ? `${age} year${age === 1 ? "" : "s"}` : "N/A"}</p>
              <p><strong>Colour:</strong> {petProfile.colour}</p>
              <p><strong>Location:</strong> {petProfile.location}</p>
            </div>

            {/* Capsules for showing the personality of the pets, should draws data from backend */}
            <div className="flex flex-wrap justify-center gap-4 mt-10 mb-8">
              <span className="px-8 py-2 bg-blue-200 text-blue-900 rounded-full font-bold border-4 border-dotted text-lg shadow">
                Playful
              </span>
              <span className="px-8 py-2 bg-green-200 text-green-900 rounded-full font-bold border-4 border-dotted text-lg shadow">
                Cute
              </span>
              <span className="px-8 py-2 bg-purple-200 text-purple-900 rounded-full font-bold border-4 border-dotted text-lg shadow">
                Friendly
              </span>
            </div>

            {/* Buttons - Centered */}
            <div className="flex justify-center gap-6">
              <button
                onClick={() => navigate('/edit-pet')}
                className="px-6 py-3 font-bold rounded-full text-white transition duration-200 bg-blue-600 hover:bg-blue-900"
              >
                Edit Profile
              </button>
              <button
                onClick={() => navigate('/home')}
                className="px-10 py-3 bg-gray-600 font-bold text-white rounded-full hover:bg-gray-900 transition duration-200"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

