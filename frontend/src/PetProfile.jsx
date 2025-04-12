// src/PetProfile.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PetProfile = () => {
  const navigate = useNavigate();
  
  // State for pet profile data
  const [petProfile, setPetProfile] = useState({
    species: '',
    breed: '',
    sex: '',
    colour: '',
    image: '',
    location: '',
    name: '',
  });
  // Keep a copy of the original data to revert if needed
  const [originalPetProfile, setOriginalPetProfile] = useState(null);
  
  // Editing toggle state
  const [isEditing, setIsEditing] = useState(false);
  
  // Loading state and messages
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // On mount, fetch current pet profile (from /current_user endpoint)
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
      return;
    }
    axios
      .get('http://127.0.0.1:5000/current_user', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        const userData = response.data;
        if (userData.petProfile) {
          const data = {
            species: userData.petProfile.species || '',
            breed: userData.petProfile.breed || '',
            sex: userData.petProfile.sex || '',
            colour: userData.petProfile.colour || '',
            image: userData.petProfile.image || '',
            location: userData.petProfile.location || '',
            name: userData.petProfile.name || '',
          };
          setPetProfile(data);
          setOriginalPetProfile(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load pet profile:", err);
        setLoading(false);
      });
  }, [navigate]);

  // Handler to update local state on changes when editing
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPetProfile(prev => ({ ...prev, [name]: value }));
  };

  // Switch to edit mode
  const handleEdit = () => {
    setIsEditing(true);
  };

  // Cancel changes: revert to original data
  const handleCancel = () => {
    if (originalPetProfile) {
      setPetProfile(originalPetProfile);
    }
    setIsEditing(false);
    setMessage('');
  };

  // Save changes: send update to backend and exit edit mode
  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('userToken');
    if (!token) {
      setMessage("Not authenticated.");
      return;
    }
    try {
      const response = await axios.post(
        'http://127.0.0.1:5000/update_pet_profile',
        petProfile,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(response.data.message);
      // Update the original data with the new state
      setOriginalPetProfile(petProfile);
      setIsEditing(false);
      // Redirect to home page if desired
      navigate('/home');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Pet profile update failed');
    }
  };

  if (loading) {
    return <p className="p-6 text-center">Loading pet profile...</p>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50">
      <div className="max-w-3xl w-full mx-auto p-6 bg-white rounded shadow">
        <h2 className="text-center text-3xl font-bold mb-6">Your Pet Profile</h2>
        
        {/* Read-only view when not editing */}
        {!isEditing ? (
          <div>
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
            <div className="mt-6 flex justify-center space-x-4">
              <button
                onClick={handleEdit}
                className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
              >
                Edit
              </button>
              <button
                onClick={() => navigate('/home')}
                className="py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none"
              >
                Home
              </button>
            </div>
            {message && (
              <div className="mt-4">
                <p className="text-center text-red-500 font-bold">{message}</p>
              </div>
            )}
          </div>
        ) : (
          // Editable form view
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                placeholder="Pet's name"
                value={petProfile.name}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Species</label>
              <input
                type="text"
                name="species"
                placeholder="Pet's species"
                value={petProfile.species}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Breed</label>
              <input
                type="text"
                name="breed"
                placeholder="Pet's breed"
                value={petProfile.breed}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Sex</label>
              <select
                name="sex"
                value={petProfile.sex}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              >
                <option value="">Select pet sex</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Colour</label>
              <input
                type="text"
                name="colour"
                placeholder="Pet's colour"
                value={petProfile.colour}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                name="location"
                placeholder="Pet's location"
                value={petProfile.location}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Image URL</label>
              <input
                type="text"
                name="image"
                placeholder="URL for pet's image"
                value={petProfile.image}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none"
              >
                Cancel
              </button>
            </div>
            {message && (
              <div className="mt-4">
                <p className="text-center text-red-500 font-bold">{message}</p>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default PetProfile;
