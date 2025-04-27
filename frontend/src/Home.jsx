// src/Home.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const sliderRef = useRef(null);

  // Matches & errors
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState('');

  // Dropdown data & filters
  const [speciesList, setSpeciesList] = useState([]);
  const [breedList, setBreedList] = useState([]);
  const [locationList, setLocationList] = useState([]);

  const [filterSpecies, setFilterSpecies] = useState('All');
  const [filterBreed, setFilterBreed] = useState('All');
  const [filterSex, setFilterSex] = useState('All');
  const [filterColour, setFilterColour] = useState('All');
  const [filterLocation, setFilterLocation] = useState('');

  // Loading flags
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(true);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('userToken');
    navigate('/login');
  };

  // Profile button logic
  const handleProfile = async () => {
    const token = localStorage.getItem('userToken');
    if (!token) return navigate('/login');
    try {
      const res = await axios.get('http://127.0.0.1:5000/current_user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.petProfile) {
        navigate('/pet-profile');
      } else {
        navigate('/pet-profile', { state: { edit: true } });
      }
    } catch {
      navigate('/pet-profile', { state: { edit: true } });
    }
  };

  // 1) load species list & world cities
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
      .catch(() => {})
      .finally(() => setLoadingLocations(false));
  }, []);

  // 2) fetch current user → default species filter
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) { navigate('/login'); return; }
    axios.get('http://127.0.0.1:5000/current_user', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      const sp = res.data.petProfile?.species || 'All';
      setFilterSpecies(sp);
    })
    .catch(() => navigate('/login'))
    .finally(() => setLoadingUser(false));
  }, [navigate]);

  // 3) fetch matches
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) return;
    axios.get('http://127.0.0.1:5000/matches', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setMatches(res.data.matches))
    .catch(err => setError(err.response?.data?.error || 'Failed to load matches'))
    .finally(() => setLoadingMatches(false));
  }, []);

  // 4) update breed list when species changes
  useEffect(() => {
    setBreedList([]);
    setFilterBreed('All');
    if (filterSpecies === 'Dog') {
      axios.get('https://api.thedogapi.com/v1/breeds')
        .then(r => setBreedList(r.data.map(b => b.name)))
        .catch(() => {});
    } else if (filterSpecies === 'Cat') {
      axios.get('https://api.thecatapi.com/v1/breeds')
        .then(r => setBreedList(r.data.map(b => b.name)))
        .catch(() => {});
    }
  }, [filterSpecies]);

  const loading = loadingUser || loadingMatches || loadingLocations;

  // apply filters + sort by petMatchScore desc
  const sortedMatches = matches
    .filter(u => {
      const p = u.petProfile || {};
      if (filterSpecies !== 'All' && p.species !== filterSpecies) return false;
      if (filterBreed   !== 'All' && p.breed   !== filterBreed)   return false;
      if (filterSex     !== 'All' && p.sex     !== filterSex)     return false;
      if (filterColour  !== 'All' && p.colour  !== filterColour)  return false;
      if (filterLocation && !p.location?.toLowerCase().includes(filterLocation.toLowerCase()))
        return false;
      return true;
    })
    .sort((a, b) => (b.petMatchScore || 0) - (a.petMatchScore || 0));

  // Carousel scroll controls
  const scrollPrev = () => {
    const el = sliderRef.current;
    if (el) el.scrollBy({ left: -el.clientWidth, behavior: 'smooth' });
  };
  const scrollNext = () => {
    const el = sliderRef.current;
    if (el) el.scrollBy({ left: el.clientWidth, behavior: 'smooth' });
  };

  // Navigate to matched pet’s detail page
  const handleMatchClick = match => {
    navigate('/match', { state: { match } });
  };

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
          {/* Paw icon: white circle, blue border */}
          <button
            onClick={handleProfile}
            className="p-2 bg-white border-2 border-blue-600 text-blue-600 rounded-full hover:bg-blue-50 transition"
            title="Edit Pet Profile"
          >
            <span role="img" aria-label="Pet Profile" className="text-xl">🐾</span>
          </button>

          {/* Logout: rounded pill with red border */}
          <button
            onClick={handleLogout}
            className="py-2 px-4 border-2 border-red-600 text-red-600 rounded-full hover:bg-red-600 hover:text-white transition"
          >
            Logout
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Filters */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Filter Matches</h2>
        <div className="grid sm:grid-cols-4 gap-4">
          {/* Species (fixed & disabled) */}
          <div>
            <label className="block text-sm font-medium">Species</label>
            <select
              value={filterSpecies}
              disabled
              className="mt-1 w-full p-2 border rounded bg-gray-100 cursor-not-allowed"
            >
              <option>{filterSpecies}</option>
            </select>
          </div>
          {/* Breed */}
          <div>
            <label className="block text-sm font-medium">Breed</label>
            <select
              value={filterBreed}
              onChange={e => setFilterBreed(e.target.value)}
              disabled={!breedList.length}
              className="mt-1 w-full p-2 border rounded bg-gray-50"
            >
              <option>All</option>
              {breedList.map(b => <option key={b}>{b}</option>)}
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
              {locationList.map(loc => <option key={loc} value={loc} />)}
            </datalist>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
        <button
          onClick={scrollPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow hover:bg-gray-100"
        >
          ‹
        </button>

        <div
          ref={sliderRef}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth w-full"
          style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}
        >
          {sortedMatches.map((u, i) => (
            <div
              key={i}
              className="snap-center flex-shrink-0 w-full flex justify-center px-4"
              style={{ scrollSnapAlign: 'center' }}
            >
              <div
                className="relative w-[32rem] h-[40rem] cursor-pointer rounded-2xl overflow-hidden shadow-lg"
                onClick={() => handleMatchClick(u)}
              >
                <img
                  src={u.petProfile.image}
                  alt={u.petProfile.name}
                  className="w-full h-full object-cover"
                />
                {/* Name overlay directly on image */}
                <h3 className="absolute bottom-4 left-4 text-4xl font-semibold text-white drop-shadow-lg">
                  {u.petProfile.name}
                </h3>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={scrollNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow hover:bg-gray-100"
        >
          ›
        </button>
      </div>
    </div>
  );
};

export default Home;
