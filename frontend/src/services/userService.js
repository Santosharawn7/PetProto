import axios from 'axios';

export const getCurrentUser = async (token) => {
  return axios.get('http://127.0.0.1:5000/current_user', {
    headers: { Authorization: `Bearer ${token}` },
  });
};