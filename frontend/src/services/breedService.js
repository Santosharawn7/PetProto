import axios from 'axios';

export const getBreedsBySpecies = async (species) => {
  if (species === 'Dog') {
    const res = await axios.get('https://api.thedogapi.com/v1/breeds');
    return res.data.map(b => b.name);
  } else if (species === 'Cat') {
    const res = await axios.get('https://api.thecatapi.com/v1/breeds');
    return res.data.map(b => b.name);
  }
  return [];
};
