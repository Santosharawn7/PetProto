import React from 'react';

const Filters = ({
  filterSpecies,
  filterBreed,
  filterSex,
  filterColour,
  filterLocation,
  speciesList,
  breedList,
  locationList,
  setFilterBreed,
  setFilterSex,
  setFilterColour,
  setFilterLocation
}) => {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-2">Filter Matches</h2>
      <div className="grid sm:grid-cols-4 gap-4">
        {/* Species (read-only) */}
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

        {/* Location with datalist */}
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
  );
};

export default Filters;
