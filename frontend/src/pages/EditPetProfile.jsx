import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Heart, Sparkles } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Mock characteristics data
const characteristicsList = [
  'Playful', 'Calm', 'Energetic', 'Friendly', 'Quiet', 'Intelligent',
  'Loyal', 'Independent', 'Affectionate', 'Protective', 'Social', 'Gentle',
  'Curious', 'Brave', 'Shy', 'Active', 'Relaxed', 'Alert'
];

const API_URL = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || 'http://127.0.0.1:5000';

export default function EditPetProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showCharacteristics, setShowCharacteristics] = useState(false);

  // You may want to fetch this from backend for a real edit page!
  const [petProfile, setPetProfile] = useState({
    name: 'Yan',
    species: 'Cat',
    breed: 'Birman',
    sex: 'Female',
    colour: 'White',
    location: 'Toronto, Canada',
    image: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&h=400&fit=crop&crop=face',
    dob: '2020-03-15',
    characteristics: ['Calm', 'Intelligent', 'Quiet']
  });
  
  const [speciesList] = useState(['Dog','Cat','Bird','Fish','Reptile','Rabbit','Rodent']);
  const [breedList, setBreedList] = useState(['Birman', 'Siamese', 'Persian', 'Maine Coon']);
  const [locationList] = useState(['Toronto, Canada', 'Vancouver, Canada', 'Montreal, Canada']);

  // Handle input changes
  const handleChange = e => {
    const { name, value } = e.target;
    setPetProfile(prev => ({ ...prev, [name]: value }));
  };

  // Characteristic toggle logic
  const handleCharacteristicToggle = (char) => {
    setPetProfile(prev => {
      let current = prev.characteristics || [];
      if (current.includes(char)) {
        return { ...prev, characteristics: current.filter(c => c !== char) };
      } else if (current.length < 3) {
        return { ...prev, characteristics: [...current, char] };
      }
      return prev;
    });
  };

  // Core: Save to backend function
  const saveProfile = async () => {
    const token = localStorage.getItem('userToken');
    const res = await axios.post(
      `${API_URL}/update_pet_profile`,
      petProfile,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data.message || "Profile saved!";
  };

  // Save button handler
  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const msg = await saveProfile();
      setMessage(msg);
      // Do not navigate here; user stays on page.
    } catch (err) {
      setMessage('Save failed');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Save & Next button handler (navigates to survey)
  const handleNext = async () => {
    setSaving(true);
    setMessage('');
    try {
      await saveProfile();
      setMessage('');
      navigate('/survey');
    } catch (err) {
      setSaving(false);
      setMessage('Save failed');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Edit Pet Profile
          </h1>
          <p className="text-gray-600">Make your furry friend shine ✨</p>
        </div>

        <div className="space-y-6">
          {/* Main Profile Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Name */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pet Name
                  </label>
                  <input
                    name="name"
                    value={petProfile.name}
                    onChange={handleChange}
                    required
                    className="w-full p-4 bg-white/60 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                    placeholder="Enter your pet's name"
                  />
                </div>
                {/* Species */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Species
                  </label>
                  <select
                    name="species"
                    value={petProfile.species}
                    onChange={handleChange}
                    required
                    className="w-full p-4 bg-white/60 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select species</option>
                    {speciesList.map(sp => (
                      <option key={sp} value={sp}>{sp}</option>
                    ))}
                  </select>
                </div>
                {/* Breed */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Breed
                  </label>
                  <select
                    name="breed"
                    value={petProfile.breed}
                    onChange={handleChange}
                    disabled={!breedList.length}
                    required
                    className="w-full p-4 bg-white/60 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 disabled:opacity-50"
                  >
                    <option value="">Select breed</option>
                    {breedList.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                {/* Sex */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sex
                  </label>
                  <select
                    name="sex"
                    value={petProfile.sex}
                    onChange={handleChange}
                    required
                    className="w-full p-4 bg-white/60 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              {/* Right Column */}
              <div className="space-y-6">
                {/* Profile Image Preview */}
                <div className="text-center">
                  <div className="relative inline-block">
                    <img
                      src={petProfile.image}
                      alt="Pet preview"
                      className="w-48 h-48 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                {/* Colour */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Colour
                  </label>
                  <input
                    name="colour"
                    value={petProfile.colour}
                    onChange={handleChange}
                    required
                    className="w-full p-4 bg-white/60 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                    placeholder="e.g. Golden Brown"
                  />
                </div>
                {/* Date of Birth */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={petProfile.dob}
                    onChange={handleChange}
                    required
                    className="w-full p-4 bg-white/60 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                  />
                </div>
                {/* Location */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    list="cities"
                    name="location"
                    value={petProfile.location}
                    onChange={handleChange}
                    placeholder="e.g. Toronto, Canada"
                    required
                    className="w-full p-4 bg-white/60 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                  />
                  <datalist id="cities">
                    {locationList.map(loc => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                </div>
                {/* Image URL */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    name="image"
                    value={petProfile.image}
                    onChange={handleChange}
                    required
                    className="w-full p-4 bg-white/60 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Characteristics Section - Collapsible */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowCharacteristics(!showCharacteristics)}
              className="w-full p-6 flex items-center justify-between hover:bg-white/40 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-gray-800">Top 3 Characteristics</h3>
                  <p className="text-sm text-gray-600">
                    {petProfile.characteristics.length}/3 selected
                  </p>
                </div>
              </div>
              {showCharacteristics ? (
                <ChevronUp className="w-6 h-6 text-gray-400" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-400" />
              )}
            </button>
            <div className={`transition-all duration-300 ease-in-out ${showCharacteristics ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
              <div className="p-6 pt-0">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {characteristicsList.map((char) => {
                    const isSelected = petProfile.characteristics.includes(char);
                    const isDisabled = !isSelected && petProfile.characteristics.length >= 3;
                    return (
                      <label
                        key={char}
                        className={`flex items-center space-x-2 cursor-pointer p-3 rounded-2xl border-2 transition-all duration-200 ${
                          isSelected
                            ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300 text-purple-800'
                            : isDisabled
                            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-white/60 border-gray-200 hover:bg-purple-50 hover:border-purple-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleCharacteristicToggle(char)}
                          disabled={isDisabled}
                          className="w-4 h-4 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                        />
                        <span className="text-sm font-medium">{char}</span>
                      </label>
                    );
                  })}
                </div>
                {/* Selected characteristics preview */}
                {petProfile.characteristics.length > 0 && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
                    <p className="text-sm font-medium text-gray-700 mb-2">Selected:</p>
                    <div className="flex flex-wrap gap-2">
                      {petProfile.characteristics.map((char, idx) => (
                        <span
                          key={char}
                          className={`px-4 py-2 rounded-full text-sm font-bold border-2 border-dotted ${
                            idx === 0
                              ? "bg-blue-100 text-blue-800 border-blue-300"
                              : idx === 1
                              ? "bg-green-100 text-green-800 border-green-300"
                              : "bg-purple-100 text-purple-800 border-purple-300"
                          }`}
                        >
                          {char}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-2xl hover:from-purple-700 hover:to-purple-800 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {saving ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Profile'
              )}
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={saving}
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-2xl hover:from-green-700 hover:to-green-800 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {saving ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                'Save & Next'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/pet-profile')}
              className="px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold rounded-2xl hover:from-gray-600 hover:to-gray-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              Cancel
            </button>
          </div>
          {/* Message */}
          {message && (
            <div className="text-center">
              <div className="inline-block px-6 py-3 bg-green-100 border border-green-300 text-green-800 rounded-2xl font-medium">
                {message}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
