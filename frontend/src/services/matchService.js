import axios from 'axios';

// Use only the env variable. Fail if not set (best for dev/prod consistency)
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("VITE_API_URL is not set! Please set it in your .env file or as an environment variable.");
}

export const getMatches = async (token) => {
  return axios.get(`${API_URL}/matches`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
