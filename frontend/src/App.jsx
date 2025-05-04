// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RegistrationForm from './pages/Registration';
import Landing from './components/Landing';
import Login from './pages/Login';
import PrivateRoute from './PrivateRoute';
import Home from './pages/Home';
import PetProfile from './pages/PetProfile';
import UpdateRegistration from './pages/UpdateRegistration';
import MatchPetProfile from './components/MatchPetProfile';
import PasswordReset from './pages/PasswordReset';
import SurveyPage from './components/Survey';
import EditPetProfile from './pages/EditPetProfile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<RegistrationForm />} />
        <Route path="/login" element={<Login />} />
        <Route path="/password-reset" element={<PasswordReset />} />
        <Route path="/match" element={<MatchPetProfile />} />
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/survey"
          element={
            <PrivateRoute>
              <SurveyPage />
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
          path="/edit-pet"
          element={
            <PrivateRoute>
              <EditPetProfile />
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
