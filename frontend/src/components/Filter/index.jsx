
// SearchAndFilters.jsx - Your Filter Component
import React from "react";
import { FaPaw } from "react-icons/fa";
import { FaVenus } from "react-icons/fa6";
import { MdLocationOn } from "react-icons/md";
import { FaSearch } from "react-icons/fa";

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
  onClose,
}) => {
  return (
    <div className="relative p-6 bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-1 right-2 text-2xl text-gray-500 hover:text-gray-800 font-bold transition-colors duration-200"
        aria-label="Close"
      >
        ×
      </button>

      {/* Pet Name Search Bar */}
      <div className="flex items-center mb-6 border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
        {/* Species */}
        <div>
          <label className="text-sm font-medium mb-2 flex items-center gap-1 text-gray-700">
            <FaPaw className="text-gray-600" /> Species
          </label>
          <select
            value={filterSpecies}
            disabled
            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
          >
            <option>{filterSpecies}</option>
          </select>
        </div>

        {/* Breed */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Breed</label>
          <select
            value={filterBreed}
            onChange={(e) => setFilterBreed(e.target.value)}
            disabled={!breedList.length}
            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option>All</option>
            {breedList.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Sex */}
        <div>
          <label className="text-sm font-medium mb-2 flex items-center gap-1 text-gray-700">
            <FaVenus className="text-pink-500" /> Sex
          </label>
          <select
            value={filterSex}
            onChange={(e) => setFilterSex(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option>All</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="text-sm font-medium mb-2 flex items-center gap-1 text-gray-700">
            <MdLocationOn className="text-blue-500" /> Location
          </label>
          <input
            list="cities"
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            placeholder="e.g. Toronto, Canada"
            className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <datalist id="cities">
            {locationList.map((loc) => (
              <option key={loc} value={loc} />
            ))}
          </datalist>
        </div>
      </div>

      {/* Apply Filters Button */}
      <button 
        onClick={onClose}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
      >
        Apply Filters
      </button>
    </div>
  );
};

export default SearchAndFilters;