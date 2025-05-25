// src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { getWorldCities } from '../services/countryService';
import { getBreedsBySpecies } from '../services/breedService';
import { getCurrentUser } from '../services/userService';
import { getMatches as getPetMatches } from '../services/matchService';
import Header from '../components/Header';
import Filters from '../components/Filter';
import MatchingCarousel from '../components/MatchingCarousel';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw, faSearch } from '@fortawesome/free-solid-svg-icons';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const Home = () => {
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [error, setError] = useState('');
  const [speciesList] = useState([
    'Dog','Cat','Bird','Fish','Reptile','Rabbit','Rodent'
  ]);
  const [breedList, setBreedList] = useState([]);
  const [locationList, setLocationList] = useState([]);

  const [filterSpecies, setFilterSpecies] = useState('All');
  const [filterBreed, setFilterBreed] = useState('All');
  const [filterSex, setFilterSex] = useState('All');
  const [filterColour, setFilterColour] = useState('All');
  const [filterLocation, setFilterLocation] = useState('');
  const [petNameQuery, setPetNameQuery] = useState('');

  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const handleMatchClick = (match) => {
    navigate('/match', { state: { match } });
  };

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('userToken');
      if (!token) return navigate('/login');

      try {
        // Load current user and city list in parallel
        const [userRes, cities] = await Promise.all([
          getCurrentUser(token),
          getWorldCities()
        ]);

        const userSpecies = userRes.data.petProfile?.species || 'All';
        setFilterSpecies(userSpecies);
        setLocationList(cities);

        // Attempt combined pet+sentiment matches first
        let matchData;
        try {
          const sentimentRes = await axios.get(
            `${API_URL}/sentiment-matches`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          matchData = sentimentRes.data.matches;
        } catch {
          // Fallback to pet-only matches
          const petRes = await getPetMatches(token);
          matchData = petRes.data.matches;
        }
        setMatches(matchData);

        // Load breed list for this species
        const breeds = await getBreedsBySpecies(userSpecies);
        setBreedList(breeds);
      } catch (err) {
        console.error(err);
        setError('Something went wrong while loading data.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [navigate]);

  // Apply filters and sort by finalMatchScore (fall back to petMatchScore if final missing)
  const sortedMatches = matches
    .filter(u => {
      const p = u.petProfile || {};
        if (filterSpecies !== 'All' && p.species !== filterSpecies) return false;
        if (filterBreed   !== 'All' && p.breed   !== filterBreed)   return false;
        if (filterSex     !== 'All' && p.sex     !== filterSex)     return false;
        if (filterColour  !== 'All' && p.colour  !== filterColour)  return false;
        if (filterLocation && !p.location?.toLowerCase().includes(filterLocation.toLowerCase())) return false;
        if (petNameQuery && !p.name?.toLowerCase().includes(petNameQuery.toLowerCase())) return false;
        return true;
    })
    .sort((a, b) => {
      const aScore = (a.finalMatchScore ?? a.petMatchScore) || 0;
      const bScore = (b.finalMatchScore ?? b.petMatchScore) || 0;
      return bScore - aScore;
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <FontAwesomeIcon icon={faPaw} className="text-blue-600 text-5xl animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Header onSearchClick={() => setShowSearchModal(true)} />
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <MatchingCarousel
        matches={sortedMatches}
        onMatchClick={handleMatchClick}
      />

      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-start justify-center pt-20">
          <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg p-6 relative">
            <button
              onClick={() => setShowSearchModal(false)}
              className="absolute top-1 right-2 font-bold text-gray-500 hover:text-gray-800 text-2xl"
            >
              ×
            </button>

            <input
              type="text"
              placeholder="Enter pet name..."
              value={petNameQuery}
              onChange={(e) => setPetNameQuery(e.target.value)}
              className="w-full p-2 mb-4 border rounded bg-gray-50"
            />

            <Filters
              speciesList={speciesList}
              breedList={breedList}
              locationList={locationList}
              filterSpecies={filterSpecies}
              filterBreed={filterBreed}
              filterSex={filterSex}
              filterColour={filterColour}
              filterLocation={filterLocation}
              setFilterBreed={setFilterBreed}
              setFilterSex={setFilterSex}
              setFilterColour={setFilterColour}
              setFilterLocation={setFilterLocation}
            />

            <div className="text-right">
              <button
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                onClick={() => setShowSearchModal(false)}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
