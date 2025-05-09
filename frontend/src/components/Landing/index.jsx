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
    // <div>
    //   <div className="bg-gradient-to-b from-blue-900 via-blue-800 to-blue-500 px-6 sm:py-20 py-10">
    //     <div className="max-w-screen-xl mx-auto text-center text-white">
    //       <h1 className="text-5xl max-sm:text-3xl font-bold leading-tight mb-6">
    //         Welcome to Pet Dating Site
    //       </h1>
    //       <p className="text-lg mb-12">
    //         Experience the pet matching and friendship through our application.
    //       </p>
          // <button 
          //   type="button"
          //   className="bg-blue-600 text-white text-lg font-medium tracking-wide px-8 py-2.5 rounded-full transition duration-300 ease-in-out shadow-lg hover:shadow-xl"
          //   onClick={() => navigate('/login')}
          // >
          //   Get Started
          // </button>
    //     </div>
    //   </div>
    // </div>
    
    <div className="w-full h-full bg-[#EDE8D0] flex items-center justify-center">
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
