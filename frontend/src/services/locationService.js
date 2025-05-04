import axios from 'axios';

const GEOAPIFY_API_KEY = '5a699564bf704f15b69c55ce65610ff6'; // Replace with your actual key

export const getFullAddressSuggestions = async (query) => {
  if (!query) return [];

  const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&limit=5&apiKey=${GEOAPIFY_API_KEY}`;
  try {
    const res = await axios.get(url);
    return res.data.features.map(item => item.properties.formatted);
  } catch (error) {
    console.error('Address autocomplete failed:', error);
    return [];
  }
};