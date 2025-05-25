// Filter/index
import React, { useState } from 'react';
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
  setFilterLocation
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full max-w-3xl mx-auto mt-6">
      {/* Search bar header */}
      {/* <div
        className="flex items-center bg-white rounded-full shadow px-4 py-2 cursor-pointer border hover:shadow-md transition"
        onClick={() => setExpanded(true)}
      >
        <FaSearch className="text-gray-500 mr-2" />
        <input
          type="text"
          placeholder="Search pets by name..."
          value={petName}
          onChange={e => setPetName(e.target.value)}
          onFocus={() => setExpanded(true)}
          className="w-full outline-none bg-transparent"
        />
      </div> */}

      {/* Expanded filter section */}
      { (
        <div className="mt-4 bg-[#fbfaf5] p-6 rounded-xl shadow-md transition-all">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* Species (read-only) */}
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
                onChange={e => setFilterBreed(e.target.value)}
                disabled={!breedList.length}
                className="w-full p-2 border rounded bg-gray-50"
              >
                <option>All</option>
                {breedList.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>

            {/* Sex */}
            <div>
              <label className="text-base font-medium mb-1 flex items-center gap-1">
                <FaVenus className="text-pink-500" /> Sex
              </label>
              <select
                value={filterSex}
                onChange={e => setFilterSex(e.target.value)}
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
                onChange={e => setFilterLocation(e.target.value)}
                placeholder="e.g. Toronto, Canada"
                className="w-full p-2 border rounded bg-white"
              />
              <datalist id="cities">
                {locationList.map(loc => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Collapse Button */}
          {/* <div className="flex justify-end mt-4">
            <button
              onClick={() => setExpanded(false)}
              className="text-sm text-blue-600 hover:underline"
            >
              Hide Filters
            </button>
          </div> */}
        </div>
      )}
    </div>
  );
};

export default SearchAndFilters;

