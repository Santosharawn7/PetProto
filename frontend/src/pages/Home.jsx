// src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getWorldCities } from '../services/countryService';
import { getBreedsBySpecies } from '../services/breedService';
import { getCurrentUser } from '../services/userService';
import { getMatches } from '../services/matchService';
import Header from '../components/Header';
import Filters from '../components/Filter'
import MatchingCarousel from '../components/MatchingCarousel';

const Home = () => {
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [error, setError] = useState('');
  const [speciesList] = useState(['Dog', 'Cat', 'Bird', 'Fish', 'Reptile', 'Rabbit', 'Rodent']);
  const [breedList, setBreedList] = useState([]);
  const [locationList, setLocationList] = useState([]);

  const [filterSpecies, setFilterSpecies] = useState('All');
  const [filterBreed, setFilterBreed] = useState('All');
  const [filterSex, setFilterSex] = useState('All');
  const [filterColour, setFilterColour] = useState('All');
  const [filterLocation, setFilterLocation] = useState('');

  const [loading, setLoading] = useState(true);

  const handleMatchClick = (match) => {
    navigate('/match', { state: { match } });
  };

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('userToken');
      if (!token) return navigate('/login');

      try {
        const [userRes, matchesRes, cities] = await Promise.all([
          getCurrentUser(token),
          getMatches(token),
          getWorldCities()
        ]);

        const userSpecies = userRes.data.petProfile?.species || 'All';
        setFilterSpecies(userSpecies);
        setLocationList(cities);
        setMatches(matchesRes.data.matches);

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

  const sortedMatches = matches
    .filter(u => {
      const p = u.petProfile || {};
      if (filterSpecies !== 'All' && p.species !== filterSpecies) return false;
      if (filterBreed !== 'All' && p.breed !== filterBreed) return false;
      if (filterSex !== 'All' && p.sex !== filterSex) return false;
      if (filterColour !== 'All' && p.colour !== filterColour) return false;
      if (filterLocation && !p.location?.toLowerCase().includes(filterLocation.toLowerCase()))
        return false;
      return true;
    })
    .sort((a, b) => (b.petMatchScore || 0) - (a.petMatchScore || 0));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Header/>
      {error && <p className="text-red-500 mb-4">{error}</p>}

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

      <MatchingCarousel matches={sortedMatches} onMatchClick={handleMatchClick} />
    </div>
  );
};

export default Home;
