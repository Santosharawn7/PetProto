import axios from 'axios';

export const getMatches = async (token) => {
  return axios.get('http://127.0.0.1:5000/matches', {
    headers: { Authorization: `Bearer ${token}` },
  });
};