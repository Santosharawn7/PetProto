import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '@/services/userService'; // adjust if not using aliases

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    navigate('/login');
  };

  const handleProfileClick = async () => {
    const token = localStorage.getItem('userToken');
    if (!token) return navigate('/login');
    try {
      const res = await getCurrentUser(token);
      if (res.data.petProfile) {
        navigate('/pet-profile');
      } else {
        navigate('/pet-profile', { state: { edit: true } });
      }
    } catch {
      navigate('/pet-profile', { state: { edit: true } });
    }
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">PetDate Home</h1>
      <div className="flex space-x-4">
        {/* Pet Profile Button */}
        <button
          onClick={handleProfileClick}
          className="p-2 bg-white border-2 border-blue-600 text-blue-600 rounded-full hover:bg-blue-50 transition"
          title="Edit Pet Profile"
        >
          <span role="img" aria-label="Pet Profile" className="text-xl">🐾</span>
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="py-2 px-4 border-2 border-red-600 text-red-600 rounded-full hover:bg-red-600 hover:text-white transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Header;
