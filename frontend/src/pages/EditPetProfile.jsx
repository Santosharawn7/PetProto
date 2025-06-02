import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import characteristicsList from '../data/characteristics.json'; // <-- Import JSON

export default function EditPetProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [petProfile, setPetProfile] = useState({
    name: '',
    species: '',
    breed: '',
    sex: '',
    colour: '',
    location: '',
    image: '',
    dob: '',
    characteristics: []
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
  const API_URL = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || 'http://127.0.0.1:5000';

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    axios.get(`${API_URL}/current_user`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      const pp = res.data.petProfile || {};
      setPetProfile({
        name:     pp.name     || '',
        species:  pp.species  || '',
        breed:    pp.breed    || '',
        sex:      pp.sex      || '',
        colour:   pp.colour   || '',
        location: pp.location || '',
        image:    pp.image    || '',
        dob:      pp.dob      || '',
        characteristics: pp.characteristics || []
      });
    })
    .catch(err => {
      console.error(err);
    })
    .finally(() => {
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

  // Handle characteristics selection
  const handleCharacteristicToggle = (char) => {
    setPetProfile(prev => {
      let current = prev.characteristics || [];
      if (current.includes(char)) {
        return { ...prev, characteristics: current.filter(c => c !== char) };
      } else if (current.length < 3) {
        return { ...prev, characteristics: [...current, char] };
      }
      return prev; // do nothing if already 3
    });
  };

  const saveProfile = async () => {
    const token = localStorage.getItem('userToken');
    const res = await axios.post(
      'http://127.0.0.1:5000/update_pet_profile',
      petProfile,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data.message;
  };

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const msg = await saveProfile();
      setMessage(msg);
      navigate('/home');
    } catch (err) {
      console.error(err);
      setMessage('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    setSaving(true);
    setMessage('');
    try {
      const msg = await saveProfile();
      setMessage(msg);
      navigate('/survey');
    } catch (err) {
      console.error(err);
      setMessage('Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-center">Loading…</p>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow mt-6">
      <h2 className="text-3xl font-semibold mb-4">Edit Pet Profile</h2>
      <form onSubmit={handleSave} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-base font-medium">Name</label>
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
          <label className="block text-base font-medium">Species</label>
          <select
            name="species"
            value={petProfile.species}
            onChange={handleChange}
            required
            className="mt-1 w-full p-3 border rounded bg-white"
          >
            <option value="">Select species</option>
            {speciesList.map(sp => (
              <option key={sp} value={sp}>{sp}</option>
            ))}
          </select>
        </div>
        {/* Breed */}
        <div>
          <label className="block text-base font-medium">Breed</label>
          <select
            name="breed"
            value={petProfile.breed}
            onChange={handleChange}
            disabled={!breedList.length}
            required
            className="mt-1 w-full p-3 border rounded bg-white"
          >
            <option value="">Select breed</option>
            {breedList.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        {/* Sex */}
        <div>
          <label className="block text-base font-medium">Sex</label>
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
          <label className="block text-base font-medium">Colour</label>
          <input
            name="colour"
            value={petProfile.colour}
            onChange={handleChange}
            required
            className="mt-1 w-full p-3 border rounded"
          />
        </div>
        {/* Date of Birth */}
        <div>
          <label className="block text-base font-medium">Date of Birth</label>
          <input
            type="date"
            name="dob"
            value={petProfile.dob}
            onChange={handleChange}
            required
            className="mt-1 w-full p-3 border rounded"
          />
        </div>
        {/* Location */}
        <div>
          <label className="block text-base font-medium">Location</label>
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
            {locationList.map(loc => (
              <option key={loc} value={loc} />
            ))}
          </datalist>
        </div>
        {/* Image URL */}
        <div>
          <label className="block text-base font-medium">Image URL</label>
          <input
            name="image"
            value={petProfile.image}
            onChange={handleChange}
            required
            className="mt-1 w-full p-3 border rounded"
          />
        </div>
        {/* --- Top 3 Characteristics --- */}
        <div>
          <label className="block text-base font-medium">Top 3 Characteristics</label>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {characteristicsList.map((char) => (
              <label key={char} className="flex items-center space-x-2 cursor-pointer border px-3 py-2 rounded hover:bg-blue-50">
                <input
                  type="checkbox"
                  checked={petProfile.characteristics.includes(char)}
                  onChange={() => handleCharacteristicToggle(char)}
                  disabled={
                    !petProfile.characteristics.includes(char) &&
                    petProfile.characteristics.length >= 3
                  }
                  className="accent-blue-600"
                />
                <span>{char}</span>
              </label>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            (Select up to 3 characteristics)
          </div>
        </div>
        {/* Buttons */}
        <div className="flex justify-center space-x-6 sm:space-x-8">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 sm:px-8 sm:py-3 bg-blue-600 text-white rounded hover:bg-blue-800"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={saving}
            className="px-4 py-2 sm:px-8 sm:py-3 bg-green-600 text-white rounded hover:bg-green-800"
          >
            {saving ? 'Saving…' : 'Next'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/pet-profile')}
            className="px-4 py-2 sm:px-8 sm:py-3 bg-red-600 text-white rounded hover:bg-red-900"
          >
            Cancel
          </button>
        </div>
        {message && (
          <p className="mt-4 text-center text-red-800">{message}</p>
        )}
      </form>
    </div>
  );
}
