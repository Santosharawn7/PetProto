// src/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

// You can import this from wherever you define it, or just paste it here:
const isValidToken = (token) => {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch (error) {
    return false;
  }
};

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('userToken');
  const valid = isValidToken(token);
  return valid ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
