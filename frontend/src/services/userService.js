import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const getCurrentUser = async (token) => {
  return axios.get(`${API_URL}/current_user`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
