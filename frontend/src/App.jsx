// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RegistrationForm from './Registration';
import Login from './Login';
import Home from './Home';
import Landing from './Landing';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route for registration */}
        <Route path="/" element={<Landing/>} />
        <Route path="/register" element={<RegistrationForm />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
