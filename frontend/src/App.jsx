// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RegistrationForm from './Registration';
import Landing from './Landing';
import Login from './Login';
import PrivateRoute from './PrivateRoute';
import Home from './Home';
import PasswordReset from './PasswordReset';
import PetProfile from './PetProfile';
import UpdateRegistration from './UpdateRegistration';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<RegistrationForm />} />
        <Route path="/login" element={<Login />} />
        <Route path="/password-reset" element={<PasswordReset />} />
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/pet-profile"
          element={
            <PrivateRoute>
              <PetProfile />
            </PrivateRoute>
          }
        />
        <Route
          path="/update_registration"
          element={
            <PrivateRoute>
              <UpdateRegistration />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
