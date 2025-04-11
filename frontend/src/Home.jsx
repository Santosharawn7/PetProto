// src/Home.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    navigate('/login');
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Welcome to PetDate Home Page</h1>
      <button 
        className="mt-4 py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none"
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
  );
};

export default Home;
