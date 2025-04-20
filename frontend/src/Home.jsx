// src/Home.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const sliderRef = useRef(null);

  // Matches & error
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState('');

  // Current user’s species (to default the filter)
  const [currentSpecies, setCurrentSpecies] = useState('');

  // Dropdown data
  const [speciesList, setSpeciesList] = useState([]);
  const [breedList, setBreedList] = useState([]);
  const [locationList, setLocationList] = useState([]);

  // Filters
  const [filterSpecies, setFilterSpecies] = useState('All');
  const [filterBreed, setFilterBreed] = useState('All');
  const [filterSex, setFilterSex] = useState('All');
  const [filterColour, setFilterColour] = useState('All');
  const [filterLocation, setFilterLocation] = useState('');

  // Loading flags
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(true);

  // Handlers
  const handleLogout = () => {
    localStorage.removeItem('userToken');
    navigate('/login');
  };
  const handleProfile = () => {
    navigate('/pet-profile');
  };

  // 1) Load static species list & fetch world cities
  useEffect(() => {
    setSpeciesList(['Dog', 'Cat', 'Bird', 'Fish', 'Reptile', 'Rabbit', 'Rodent']);

    axios
      .get('https://countriesnow.space/api/v0.1/countries')
      .then(res => {
        const cities = [];
        res.data.data.forEach(country => {
          country.cities.forEach(city => {
            cities.push(`${city}, ${country.country}`);
          });
        });
        setLocationList(cities);
      })
      .catch(() => {
        // Optionally set an error
      })
      .finally(() => {
        setLoadingLocations(false);
      });
  }, []);

  // 2) Fetch current user’s species (to default filter)
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
      .then(res => {
        const species = res.data.petProfile?.species || 'All';
        setCurrentSpecies(species);
        setFilterSpecies(species);
      })
      .catch(() => {
        navigate('/login');
      })
      .finally(() => {
        setLoadingUser(false);
      });
  }, [navigate]);

  // 3) Fetch all matches
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) return;
    axios
      .get('http://127.0.0.1:5000/matches', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setMatches(res.data.matches))
      .catch(err => setError(err.response?.data?.error || 'Failed to load matches'))
      .finally(() => setLoadingMatches(false));
  }, []);

  // 4) Fetch breed list whenever species filter changes
  useEffect(() => {
    setBreedList([]);
    setFilterBreed('All');

    if (filterSpecies === 'Dog') {
      axios
        .get('https://api.thedogapi.com/v1/breeds')
        .then(res => setBreedList(res.data.map(b => b.name)))
        .catch(() => {});
    } else if (filterSpecies === 'Cat') {
      axios
        .get('https://api.thecatapi.com/v1/breeds')
        .then(res => setBreedList(res.data.map(b => b.name)))
        .catch(() => {});
    }
  }, [filterSpecies]);

  // Derived loading
  const loading = loadingUser || loadingMatches || loadingLocations;

  // 5) Filter & sort
  const sortedMatches = matches
    .filter(u => {
      const pet = u.petProfile || {};
      if (filterSpecies !== 'All' && pet.species !== filterSpecies) return false;
      if (filterBreed   !== 'All' && pet.breed   !== filterBreed)   return false;
      if (filterSex     !== 'All' && pet.sex     !== filterSex)     return false;
      if (filterColour  !== 'All' && pet.colour  !== filterColour)  return false;
      if (
        filterLocation &&
        !pet.location?.toLowerCase().includes(filterLocation.toLowerCase())
      ) return false;
      return true;
    })
    .sort((a, b) => (b.petMatchScore || 0) - (a.petMatchScore || 0));

  // Carousel controls
  const scrollPrev = () => {
    const el = sliderRef.current;
    if (el) el.scrollBy({ left: -el.clientWidth, behavior: 'smooth' });
  };
  const scrollNext = () => {
    const el = sliderRef.current;
    if (el) el.scrollBy({ left: el.clientWidth, behavior: 'smooth' });
  };

  // Loading spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">PetDate Home</h1>
        <div className="flex space-x-4">
          <button onClick={handleProfile} className="p-2 bg-blue-600 text-white rounded-full">
            <span role="img" aria-label="Pet Profile" className="text-xl">🐾</span>
          </button>
          <button onClick={handleLogout} className="py-2 px-4 bg-red-600 text-white rounded">
            Logout
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Filters */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Filter Matches</h2>
        <div className="grid sm:grid-cols-4 gap-4">
          {/* Species */}
          <div>
            <label className="block text-sm font-medium">Species</label>
            <select
              value={filterSpecies}
              onChange={e => setFilterSpecies(e.target.value)}
              className="mt-1 w-full p-2 border rounded bg-gray-50"
            >
              <option>All</option>
              {speciesList.map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          {/* Breed */}
          <div>
            <label className="block text-sm font-medium">Breed</label>
            <select
              value={filterBreed}
              onChange={e => setFilterBreed(e.target.value)}
              disabled={breedList.length === 0}
              className="mt-1 w-full p-2 border rounded bg-gray-50"
            >
              <option>All</option>
              {breedList.map(b => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>
          {/* Sex */}
          <div>
            <label className="block text-sm font-medium">Sex</label>
            <select
              value={filterSex}
              onChange={e => setFilterSex(e.target.value)}
              className="mt-1 w-full p-2 border rounded bg-gray-50"
            >
              <option>All</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
          {/* Colour */}
          <div>
            <label className="block text-sm font-medium">Colour</label>
            <select
              value={filterColour}
              onChange={e => setFilterColour(e.target.value)}
              className="mt-1 w-full p-2 border rounded bg-gray-50"
            >
              <option>All</option>
              <option>Black</option>
              <option>White</option>
              <option>Brown</option>
            </select>
          </div>
          {/* Location */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Location</label>
            <input
              list="cities"
              value={filterLocation}
              onChange={e => setFilterLocation(e.target.value)}
              placeholder="e.g. Toronto, Canada"
              className="mt-1 w-full p-2 border rounded bg-white"
            />
            <datalist id="cities">
              {locationList.map(loc => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
        <button
          onClick={scrollPrev}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow hover:bg-gray-100"
        >
          ‹
        </button>

        <div
          ref={sliderRef}
          className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory w-full"
          style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}
        >
          {sortedMatches.map((u, idx) => (
            <div
              key={idx}
              className="snap-center flex-shrink-0 w-full flex justify-center p-4"
              style={{ scrollSnapAlign: 'center' }}
            >
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-xl w-full">
                {u.petProfile.image ? (
                  <img
                    src={u.petProfile.image}
                    alt={u.petProfile.name}
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200" />
                )}
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-2">{u.petProfile.name}</h3>
                  <p className="mb-1">Species: {u.petProfile.species}</p>
                  <p className="mb-1">Breed: {u.petProfile.breed}</p>
                  <p className="mb-1">Sex: {u.petProfile.sex}</p>
                  <p className="mb-1">Colour: {u.petProfile.colour}</p>
                  <p className="mb-1">Location: {u.petProfile.location}</p>
                  <p className="mt-4 text-lg font-semibold">
                    Score: {u.petMatchScore}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={scrollNext}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow hover:bg-gray-100"
        >
          ›
        </button>
      </div>
    </div>
  );
};

export default Home;
