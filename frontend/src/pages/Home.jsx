import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { getWorldCities } from '../services/countryService';
import { getBreedsBySpecies } from '../services/breedService';
import { getCurrentUser } from '../services/userService';
import { getMatches as getPetMatches } from '../services/matchService';
// import Header from '../components/Header'; // REMOVE this line!
import Filters from '../components/Filter';
import MatchingCarousel from '../components/MatchingCarousel';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw, faPlus } from '@fortawesome/free-solid-svg-icons';

const API_URL = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || 'http://127.0.0.1:5000';

const Home = ({ showSearchModal, setShowSearchModal }) => {
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [error, setError] = useState('');
  const [speciesList] = useState([
    'Dog', 'Cat', 'Bird', 'Fish', 'Reptile', 'Rabbit', 'Rodent'
  ]);
  const [breedList, setBreedList] = useState([]);
  const [locationList, setLocationList] = useState([]);

  const [filterSpecies, setFilterSpecies] = useState('All');
  const [filterBreed, setFilterBreed] = useState('All');
  const [filterSex, setFilterSex] = useState('All');
  const [filterColour, setFilterColour] = useState('All');
  const [filterLocation, setFilterLocation] = useState('');
  const [petNameQuery, setPetNameQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [hasPetProfile, setHasPetProfile] = useState(false);

  const handleMatchClick = (match) => {
    navigate('/match', { state: { match } });
  };

  const handleCreatePetProfile = () => {
    navigate('/edit-pet');
  };

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('userToken');
      if (!token) return navigate('/login');

      try {
        const [userRes, cities] = await Promise.all([
          getCurrentUser(token),
          getWorldCities()
        ]);

        const userPetProfile = userRes.data.petProfile;
        setHasPetProfile(!!userPetProfile);

        const userSpecies = userPetProfile?.species || 'All';
        setFilterSpecies(userSpecies);
        setLocationList(cities);

        let matchData = [];
        
        // Only try to get matches if user has a pet profile
        if (userPetProfile) {
          try {
            const sentimentRes = await axios.get(
              `${API_URL}/sentiment-matches`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            matchData = sentimentRes.data.matches;
          } catch {
            const petRes = await getPetMatches(token);
            matchData = petRes.data.matches;
          }
        }

        setMatches(matchData);

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
      {/* No Header here! */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Show Create Pet Profile button if no pet profile exists */}
      {!hasPetProfile ? (
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
            <FontAwesomeIcon icon={faPaw} className="text-blue-600 text-6xl mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Create Your Pet Profile
            </h2>
            <p className="text-gray-600 mb-6">
              To start finding matches for your pet, you need to create a pet profile first.
            </p>
            <button
              onClick={handleCreatePetProfile}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200 shadow-md"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Create Pet Profile
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Matching Carousel - only show if user has pet profile */}
          <div className="flex justify-center w-full">
            <div className="w-full sm:w-[24rem] md:w-[40rem] mt-21 md:mt-0 -px-1">
              {sortedMatches.length > 0 ? (
                <MatchingCarousel
                  matches={sortedMatches}
                  onMatchClick={handleMatchClick}
                />
              ) : (
                <div className="text-center bg-white rounded-lg shadow-lg p-8">
                  <FontAwesomeIcon icon={faPaw} className="text-gray-400 text-4xl mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No Matches Found
                  </h3>
                  <p className="text-gray-500">
                    Try adjusting your filters to find more matches for your pet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* SEARCH MODAL - only show if user has pet profile */}
      {showSearchModal && hasPetProfile && (
        <div className="fixed inset-0 bg-gradient-to-r from-orange-100 to-purple-100 bg-opacity-30 z-50 flex items-start justify-center pt-20 px-2">
          <div className="bg-[#fffffc] w-full max-w-3xl rounded-lg shadow-lg p-4 relative">
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
              petName={petNameQuery}
              setPetName={setPetNameQuery}
              onClose={() => setShowSearchModal(false)}
            />

            <div className="text-right">
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
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