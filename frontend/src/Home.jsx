// src/Home.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState('');
  
  // Filter states for Species, Breed, Sex, Colour, and Location
  const [filterSpecies, setFilterSpecies] = useState('All');
  const [filterBreed, setFilterBreed] = useState('All');
  const [filterSex, setFilterSex] = useState('All');
  const [filterColour, setFilterColour] = useState('All');
  const [filterLocation, setFilterLocation] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    navigate('/login');
  };

  // Handler for pet profile navigation
  const handleProfile = () => {
    navigate('/pet-profile');
  };

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
      return;
    }

    axios
      .get('http://127.0.0.1:5000/matches', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        setMatches(response.data.matches);
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Failed to load matches');
      });
  }, [navigate]);

  // Filter matches based on pet profile criteria
  const filteredMatches = matches.filter(user => {
    const pet = user.petProfile || {};
    const speciesMatch = filterSpecies === 'All' ||
      (pet.species && pet.species.toLowerCase() === filterSpecies.toLowerCase());
    const breedMatch = filterBreed === 'All' ||
      (pet.breed && pet.breed.toLowerCase() === filterBreed.toLowerCase());
    const sexMatch = filterSex === 'All' ||
      (pet.sex && pet.sex.toLowerCase() === filterSex.toLowerCase());
    const colourMatch = filterColour === 'All' ||
      (pet.colour && pet.colour.toLowerCase() === filterColour.toLowerCase());
    const locationMatch = filterLocation === '' ||
      (pet.location && pet.location.toLowerCase().includes(filterLocation.toLowerCase()));
    return speciesMatch && breedMatch && sexMatch && colourMatch && locationMatch;
  });

  return (
    <div className="p-6">
      {/* Header with Welcome text, Profile button and Logout button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Welcome to PetDate Home Page</h1>
        <div className="flex space-x-4">
          {/* Profile Button with Pet Icon */}
          <button 
            onClick={handleProfile}
            title="Profile"
            className="flex items-center justify-center p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none"
          >
            {/* Using an emoji for paw icon; you can replace with an inline SVG or icon library */}
            <span role="img" aria-label="Pet Profile" className="text-xl">🐾</span>
          </button>
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none"
          >
            Logout
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {/* Filter Controls */}
      <div className="mt-8 mb-4">
        <h2 className="text-xl font-semibold mb-2">Filter Matches</h2>
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
          <div className="mb-2 sm:mb-0">
            <label className="block text-sm font-medium text-gray-700">Species:</label>
            <select
              value={filterSpecies}
              onChange={e => setFilterSpecies(e.target.value)}
              className="mt-1 block w-full p-2 border rounded"
            >
              <option value="All">All</option>
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
              <option value="Bird">Bird</option>
              {/* Add more species as needed */}
            </select>
          </div>
          <div className="mb-2 sm:mb-0">
            <label className="block text-sm font-medium text-gray-700">Breed:</label>
            <select
              value={filterBreed}
              onChange={e => setFilterBreed(e.target.value)}
              className="mt-1 block w-full p-2 border rounded"
            >
              <option value="All">All</option>
              <option value="Labrador">Labrador</option>
              <option value="Persian">Persian</option>
              <option value="Parakeet">Parakeet</option>
              {/* Add more breed options as needed */}
            </select>
          </div>
          <div className="mb-2 sm:mb-0">
            <label className="block text-sm font-medium text-gray-700">Sex:</label>
            <select
              value={filterSex}
              onChange={e => setFilterSex(e.target.value)}
              className="mt-1 block w-full p-2 border rounded"
            >
              <option value="All">All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="mb-2 sm:mb-0">
            <label className="block text-sm font-medium text-gray-700">Colour:</label>
            <select
              value={filterColour}
              onChange={e => setFilterColour(e.target.value)}
              className="mt-1 block w-full p-2 border rounded"
            >
              <option value="All">All</option>
              <option value="Black">Black</option>
              <option value="White">White</option>
              <option value="Brown">Brown</option>
              {/* Add more colour options as needed */}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Location:</label>
            <input
              type="text"
              value={filterLocation}
              onChange={e => setFilterLocation(e.target.value)}
              placeholder="Filter by location"
              className="mt-1 block w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>

      {/* Display Matches */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Potential Matches</h2>
        {filteredMatches.length > 0 ? (
          <ul>
            {filteredMatches.map((user, index) => (
              <li key={index} className="border p-4 rounded mb-4 flex gap-4">
                <div className="w-24 h-24 flex-shrink-0">
                  {user.petProfile && user.petProfile.image ? (
                    <img
                      src={user.petProfile.image}
                      alt={user.petProfile.name}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded" />
                  )}
                </div>
                <div>
                  <p className="font-bold">Name: {user.petProfile.name}</p>
                  <p>Species: {user.petProfile.species}</p>
                  <p>Breed: {user.petProfile.breed}</p>
                  <p>Sex: {user.petProfile.sex}</p>
                  <p>Colour: {user.petProfile.colour}</p>
                  <p>Location: {user.petProfile.location}</p>
                  <p>Match Score: {user.petMatchScore}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No matches found.</p>
        )}
      </div>
    </div>
  );
};

export default Home;
