import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAuthToken, isValidToken, getUserData } from './utils/auth';

// Allowed route prefixes for each user type
const ACCESSIBLE_ROUTES = {
  pet_shop_owner: [
    '/shop', // allow /shop and ALL its subroutes
  ],
  pet_parent: [
    '/home',
    '/pet-profile',
    '/edit-pet',
    '/survey',
    '/chat',
    '/community',
    '/friends',
    '/update_registration',
    '/match',
    '/shop',
    '/messages' // optionally allow shop browsing for pet_parent (remove if you want only pet_shop_owner in /shop)
  ],
  // add other user types here...
};

// Checks if route is allowed for the userType
function isRouteAllowed(userType, pathname) {
  if (!userType) return false;
  const allowedPrefixes = ACCESSIBLE_ROUTES[userType] || [];
  // Must match *exactly* the start of the pathname
  return allowedPrefixes.some(prefix =>
    prefix === pathname || pathname.startsWith(prefix + '/')
  );
}

const PrivateRoute = ({ children }) => {
  const token = getAuthToken();
  const location = useLocation();
  const userData = getUserData();
  const userType = userData?.userType;

  // Not logged in? Redirect to login
  if (!token || !isValidToken(token)) {
    return <Navigate to="/login" replace />;
  }

  // If the user has a userType and is trying to access an unauthorized route
  if (userType && !isRouteAllowed(userType, location.pathname)) {
    // Redirect to default page per userType
    if (userType === 'pet_shop_owner') return <Navigate to="/shop" replace />;
    if (userType === 'pet_parent') return <Navigate to="/home" replace />;
    // fallback
    return <Navigate to="/" replace />;
  }

  // All checks passed
  return children;
};

export default PrivateRoute;
