// src/pages/PreHome.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const HEADER_IMAGE =
  "https://img.freepik.com/premium-photo/cute-dog-cat-lying-together-green-grass-field-nature-spring-sunny-background_1238406-1151.jpg";

export default function PreHome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fdfcf6] flex flex-col">
      {/* Header image */}
      <div
        className="w-full h-64 bg-center bg-cover"
        style={{
          backgroundImage: `url(${HEADER_IMAGE})`,
          borderBottomLeftRadius: "2rem",
          borderBottomRightRadius: "2rem",
        }}
      >
        {/* Optional overlay */}
        <div className="w-full h-full bg-gradient-to-t from-black/40 to-transparent flex items-end">
          <h1 className="text-white text-4xl font-bold p-8 drop-shadow-lg">
            Welcome to Omniverse of Pets
          </h1>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="flex justify-center mt-4 space-x-10 text-lg">
        <NavLink
          to="/about"
          className={({ isActive }) =>
            isActive
              ? "border-b-2 border-blue-600 text-blue-700 font-bold pb-1"
              : "text-gray-800 hover:text-blue-600 pb-1"
          }
        >
          About
        </NavLink>
        <NavLink
          to="/community"
          className={({ isActive }) =>
            isActive
              ? "border-b-2 border-blue-600 text-blue-700 font-bold pb-1"
              : "text-gray-800 hover:text-blue-600 pb-1"
          }
        >
          Community
        </NavLink>
      </nav>

      {/* Main section */}
      <main className="flex flex-col items-center justify-center flex-1 p-8">
        <h2 className="text-2xl font-semibold mb-4 text-center">
          The universe where all pets connect!
        </h2>
        <p className="text-gray-700 max-w-2xl text-center mb-6">
          Omniverse of Pets is a friendly community for all pet lovers—where dogs, cats, bunnies, birds, and more find friends, share stories, and discover new companions. Join us and be a part of the universe that celebrates every pet!
        </p>
        <button
          onClick={() => navigate("/register")}
          className="mt-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 transition"
        >
          Get Started
        </button>
      </main>
    </div>
  );
}
