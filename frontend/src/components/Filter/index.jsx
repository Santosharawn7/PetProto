import React from 'react';
import { FaPaw } from 'react-icons/fa';
import { FaVenus } from 'react-icons/fa6';
import { MdLocationOn } from 'react-icons/md';
import { FaSearch } from 'react-icons/fa';

const SearchAndFilters = ({
  filterSpecies,
  filterBreed,
  filterSex,
  filterLocation,
  speciesList,
  breedList,
  locationList,
  petName,
  setPetName,
  setFilterBreed,
  setFilterSex,
  setFilterLocation,
  onClose
}) => {
  return (
    <div className="relative p-9 bg-[#fffffc]">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-0.5 right-2 text-3xl text-gray-500 hover:text-gray-800 font-bold"
        aria-label="Close"
      >
        ×
      </button>

      {/* Pet Name Search Bar */}
      <div className="flex items-center mb-6 border border-gray-500 rounded px-3 py-2 bg-white shadow-sm">
        <FaSearch className="text-gray-500 mr-2" />
        <input
          type="text"
          value={petName}
          onChange={(e) => setPetName(e.target.value)}
          placeholder="Enter pet name..."
          className="w-full outline-none bg-transparent text-gray-700"
        />
      </div>

      {/* Filter Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Species */}
        <div>
          <label className="text-base font-medium mb-1 flex items-center gap-1">
            <FaPaw className="text-gray-600" /> Species
          </label>
          <select
            value={filterSpecies}
            disabled
            className="w-full p-2 border rounded bg-gray-100 cursor-not-allowed"
          >
            <option>{filterSpecies}</option>
          </select>
        </div>

        {/* Breed */}
        <div>
          <label className="block text-base text-left font-medium mb-1">Breed</label>
          <select
            value={filterBreed}
            onChange={(e) => setFilterBreed(e.target.value)}
            disabled={!breedList.length}
            className="w-full p-2 border rounded bg-gray-50"
          >
            <option>All</option>
            {breedList.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Sex */}
        <div>
          <label className="text-base font-medium mb-1 flex items-center gap-1">
            <FaVenus className="text-pink-500" /> Sex
          </label>
          <select
            value={filterSex}
            onChange={(e) => setFilterSex(e.target.value)}
            className="w-full p-2 border rounded bg-gray-50"
          >
            <option>All</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="text-base font-medium mb-1 flex items-center gap-1">
            <MdLocationOn className="text-blue-500" /> Location
          </label>
          <input
            list="cities"
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            placeholder="e.g. Toronto, Canada"
            className="w-full p-2 border rounded bg-white"
          />
          <datalist id="cities">
            {locationList.map((loc) => (
              <option key={loc} value={loc} />
            ))}
          </datalist>
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilters;
