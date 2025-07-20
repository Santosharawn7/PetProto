import axios from 'axios';

// Robust API_URL configuration for all environments
const API_URL = import.meta.env.VITE_API_URL || 
                process.env.VITE_API_URL || 
                process.env.REACT_APP_API_URL ||
                'https://backend-ugok.onrender.com' || 
                'http://127.0.0.1:5000'; 

console.log('MatchService API_URL:', API_URL); // Debug log

export const getMatches = async (token) => {
  return axios.get(`${API_URL}/matches`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};