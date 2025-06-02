import axios from 'axios';

// Use the environment variable if available, otherwise default to localhost
const API_URL = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || 'http://127.0.0.1:5000';

export const getMatches = async (token) => {
  return axios.get(`${API_URL}/matches`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};