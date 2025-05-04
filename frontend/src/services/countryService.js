import axios from 'axios';

export const getWorldCities = async () => {
  const response = await axios.get('https://countriesnow.space/api/v0.1/countries');
  const cities = [];
  response.data.data.forEach(c =>
    c.cities.forEach(city => cities.push(`${city}, ${c.country}`))
  );
  return cities;
};