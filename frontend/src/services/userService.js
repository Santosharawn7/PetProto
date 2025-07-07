import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || 'http://127.0.0.1:5000';

export const getCurrentUser = async (token) => {
  return axios.get(`${API_URL}/current_user`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
