// src/PetProfile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const PetProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if we were forced into edit mode
  const initialEdit = location.state?.edit === true;

  // track if user _had_ a profile on load
  const [hasProfile, setHasProfile] = useState(true);

  const [isEditing, setIsEditing] = useState(initialEdit);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [petProfile, setPetProfile] = useState({
    name: '',
    species: '',
    breed: '',
    sex: '',
    colour: '',
    location: '',
    image: '',
  });
  const [originalPetProfile, setOriginalPetProfile] = useState(null);

  const [speciesList, setSpeciesList] = useState([]);
  const [breedList, setBreedList] = useState([]);
  const [locationList, setLocationList] = useState([]);

  // 1) load species + cities
  useEffect(() => {
    setSpeciesList(['Dog','Cat','Bird','Fish','Reptile','Rabbit','Rodent']);
    axios.get('https://countriesnow.space/api/v0.1/countries')
      .then(res => {
        const cities = [];
        res.data.data.forEach(c =>
          c.cities.forEach(city => cities.push(`${city}, ${c.country}`))
        );
        setLocationList(cities);
      })
      .catch(() => {});
  }, []);

  // 2) fetch current_user → load or blank, set hasProfile
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
      const ppRaw = res.data.petProfile || null;
      setHasProfile(!!ppRaw);
      const data = {
        name:     ppRaw?.name     || '',
        species:  ppRaw?.species  || '',
        breed:    ppRaw?.breed    || '',
        sex:      ppRaw?.sex      || '',
        colour:   ppRaw?.colour   || '',
        location: ppRaw?.location || '',
        image:    ppRaw?.image    || '',
      };
      setPetProfile(data);
      setOriginalPetProfile(data);
      setLoading(false);
    })
    .catch(err => {
      console.error('Failed to load pet profile:', err);
      setHasProfile(false);
      setLoading(false);
    });
  }, [navigate]);

  // 3) update breed list when species changes
  useEffect(() => {
    setBreedList([]);
    setPetProfile(p => ({ ...p, breed: '' }));
    if (petProfile.species === 'Dog') {
      axios.get('https://api.thedogapi.com/v1/breeds')
        .then(r => setBreedList(r.data.map(b => b.name)))
        .catch(() => {});
    } else if (petProfile.species === 'Cat') {
      axios.get('https://api.thecatapi.com/v1/breeds')
        .then(r => setBreedList(r.data.map(b => b.name)))
        .catch(() => {});
    }
  }, [petProfile.species]);

  // handlers
  const handleChange = e => {
    const { name, value } = e.target;
    setPetProfile(p => ({ ...p, [name]: value }));
  };
  const handleEdit   = () => setIsEditing(true);

  const handleCancel = () => {
    if (!hasProfile) {
      // no existing profile → go back home
      navigate('/home');
    } else {
      // revert to view mode
      setPetProfile(originalPetProfile);
      setIsEditing(false);
      setMessage('');
    }
  };

  const handleSave = async e => {
    e.preventDefault();
    const token = localStorage.getItem('userToken');
    if (!token) { setMessage('Not authenticated.'); return; }
    try {
      const res = await axios.post(
        'http://127.0.0.1:5000/update_pet_profile',
        petProfile,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      setOriginalPetProfile(petProfile);
      setHasProfile(true);
      setIsEditing(false);
      navigate('/home');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Pet profile update failed');
    }
  };

  if (loading) {
    return <p className="p-6 text-center">Loading pet profile…</p>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50">
      <div className="max-w-3xl w-full mx-auto p-6 bg-white rounded shadow">
        <h2 className="text-center text-3xl font-bold mb-6">Your Pet Profile</h2>

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
            {message && (
              <p className="mt-4 text-center text-red-500 font-bold">{message}</p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                name="name"
                value={petProfile.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            {/* Species */}
            <div>
              <label className="block text-sm font-medium">Species</label>
              <select
                name="species"
                value={petProfile.species}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 border rounded bg-white focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select species</option>
                {speciesList.map(sp => (
                  <option key={sp} value={sp}>{sp}</option>
                ))}
              </select>
            </div>
            {/* Breed */}
            <div>
              <label className="block text-sm font-medium">Breed</label>
              <select
                name="breed"
                value={petProfile.breed}
                onChange={handleChange}
                disabled={!breedList.length}
                required
                className="mt-1 block w-full px-4 py-3 border rounded bg-white focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select breed</option>
                {breedList.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            {/* Sex */}
            <div>
              <label className="block text-sm font-medium">Sex</label>
              <select
                name="sex"
                value={petProfile.sex}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 border rounded focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select sex</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            {/* Colour */}
            <div>
              <label className="block text-sm font-medium">Colour</label>
              <input
                name="colour"
                value={petProfile.colour}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 border rounded focus:ring-2 focus:ring-blue-400"
              />
            </div>
            {/* Location */}
            <div>
              <label className="block text-sm font-medium">Location</label>
              <input
                list="cities"
                name="location"
                value={petProfile.location}
                onChange={handleChange}
                placeholder="e.g. Toronto, Canada"
                required
                className="mt-1 block w-full px-4 py-3 border rounded focus:ring-2 focus:ring-blue-400"
              />
              <datalist id="cities">
                {locationList.map(loc => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>
            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium">Image URL</label>
              <input
                name="image"
                value={petProfile.image}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 border rounded focus:ring-2 focus:ring-blue-400"
              />
            </div>
            {/* Save / Cancel */}
            <div className="flex space-x-4">
              <button
                type="submit"
                className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
            {message && (
              <p className="mt-4 text-center text-red-500 font-bold">{message}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default PetProfile;
