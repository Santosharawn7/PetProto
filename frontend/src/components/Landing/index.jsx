// src/Landing.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  // On mount, check if the user is already logged in.
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) {
      navigate('/home');
    }
  }, [navigate]);

  return (
    
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full max-w-screen-xl p-6">
        <div className="text-center">
          {/* Label */}
          <span className="inline-block py-4 px-5 mb-4 text-lg text-green-700 bg-green-100 font-bold  rounded-full shadow-sm">
            PetBridge
          </span>

          {/* Heading */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">
            Experience pet matching and friendship through our application.
          </h1>

          {/* Image */}
          <div className="flex justify-center mb-8">
            <img
              src="https://www.quytech.com/blog/wp-content/uploads/2021/03/Pet-App.jpg"
              alt="Pet adoption preview"
              className="w-full max-w-2xl rounded shadow-lg"
            />
          </div>

     {/* Button */}
          <button
            onClick={() => navigate('/login')}
            className="bg-purple-700 text-orange-300 font-bold text-lg py-3 px-8 rounded hover:bg-purple-900 transition"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
