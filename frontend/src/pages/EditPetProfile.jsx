// src/EditPetProfile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function EditPetProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [petProfile, setPetProfile] = useState({
    name: '',
    species: '',
    breed: '',
    sex: '',
    colour: '',
    location: '',
    image: ''
  });
  const [speciesList, setSpeciesList] = useState([]);
  const [breedList, setBreedList] = useState([]);
  const [locationList, setLocationList] = useState([]);

  // Load species and location options
  useEffect(() => {
    setSpeciesList(['Dog','Cat','Bird','Fish','Reptile','Rabbit','Rodent']);
    axios.get('https://countriesnow.space/api/v0.1/countries')
      .then(res => {
        const cities = [];
        res.data.data.forEach(country =>
          country.cities.forEach(city => cities.push(`${city}, ${country.country}`))
        );
        setLocationList(cities);
      })
      .catch(console.error);
  }, []);

  // Fetch existing pet profile
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    axios.get('http://127.0.0.1:5000/current_user', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      const pp = res.data.petProfile || {};
      setPetProfile({
        name: pp.name || '',
        species: pp.species || '',
        breed: pp.breed || '',
        sex: pp.sex || '',
        colour: pp.colour || '',
        location: pp.location || '',
        image: pp.image || ''
      });
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  // Update breed list based on species
  useEffect(() => {
    if (petProfile.species === 'Dog') {
      axios.get('https://api.thedogapi.com/v1/breeds')
        .then(r => setBreedList(r.data.map(b => b.name)))
        .catch(console.error);
    } else if (petProfile.species === 'Cat') {
      axios.get('https://api.thecatapi.com/v1/breeds')
        .then(r => setBreedList(r.data.map(b => b.name)))
        .catch(console.error);
    } else {
      setBreedList([]);
    }
  }, [petProfile.species]);

  const handleChange = e => {
    const { name, value } = e.target;
    setPetProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async e => {
    e.preventDefault();
    const token = localStorage.getItem('userToken');
    try {
      const res = await axios.post(
        'http://127.0.0.1:5000/update_pet_profile',
        petProfile,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      // Navigate to home so user can view or find other matches without survey
      navigate('/home');
    } catch (err) {
      console.error(err);
      setMessage('Save failed');
    }
  };

  if (loading) return <p className="p-6 text-center">Loading…</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow mt-6">
      <h2 className="text-2xl font-semibold mb-4">Edit Pet Profile</h2>
      <form onSubmit={handleSave} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            name="name"
            value={petProfile.name}
            onChange={handleChange}
            required
            className="mt-1 w-full p-3 border rounded"
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
            className="mt-1 w-full p-3 border rounded bg-white"
          >
            <option value="">Select species</option>
            {speciesList.map(sp => <option key={sp} value={sp}>{sp}</option>)}
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
            className="mt-1 w-full p-3 border rounded bg-white"
          >
            <option value="">Select breed</option>
            {breedList.map(b => <option key={b} value={b}>{b}</option>)}
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
            className="mt-1 w-full p-3 border rounded bg-white"
          >
            <option value="">Select sex</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
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
            className="mt-1 w-full p-3 border rounded"
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
            className="mt-1 w-full p-3 border rounded"
          />
          <datalist id="cities">
            {locationList.map(loc => <option key={loc} value={loc}/>)}
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
            className="mt-1 w-full p-3 border rounded"
          />
        </div>
        {/* Buttons */}
        <div className="flex space-x-4">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => navigate('/survey')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Next
          </button>
          <button
            type="button"
            onClick={() => navigate('/pet-profile')}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
        {message && <p className="mt-4 text-center text-red-800">{message}</p>}
      </form>
    </div>
  );
}
