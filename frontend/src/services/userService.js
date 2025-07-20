import axios from 'axios';

// Robust API_URL configuration for all environments
const API_URL = import.meta.env.VITE_API_URL || 
                process.env.VITE_API_URL || 
                process.env.REACT_APP_API_URL ||
                'https://backend-ugok.onrender.com' || // Replace with your actual production URL
                'http://127.0.0.1:5000'; // Fallback for local development

console.log('UserService API_URL:', API_URL); // Debug log

export const getCurrentUser = async (token) => {
  return axios.get(`${API_URL}/current_user`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};