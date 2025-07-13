import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
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
import ChatPage from './components/ChatPage';
import CommunityPage from './components/CommunityPage';
import FriendList from './components/FriendList';
import PreHome from './components/Prehome';
import Header from './components/Header';

// Helper function to check if token is valid (you can enhance this)
const isValidToken = (token) => {
  if (!token) return false;
  
  try {
    // Add your token validation logic here
    // For example, check if token is expired
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch (error) {
    return false;
  }
};

// Component to handle conditional header rendering
function AppContent() {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  // Check authentication status
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem("userToken");
      const validToken = isValidToken(token);
      setIsLoggedIn(validToken);
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Listen for storage changes (cross-tab logout/login)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'userToken') {
        const token = e.newValue;
        const validToken = isValidToken(token);
        setIsLoggedIn(validToken);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Handle logout - this will immediately update the state
  const handleLogout = () => {
    localStorage.removeItem('userToken');
    setIsLoggedIn(false); // This immediately hides the header
    // Optionally redirect to login page
    // window.location.href = '/login';
  };

  // Update login status when user logs in - this will immediately update the state
  const handleLogin = (token) => {
    localStorage.setItem('userToken', token);
    setIsLoggedIn(true); // This immediately shows the header
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  return (
    <>
      {/* Header/Nav only shows if user is logged in */}
      {isLoggedIn && (
        <Header
          onSearchClick={() => setShowSearchModal(true)}
          setIsLoggedIn={setIsLoggedIn}
          onLogout={handleLogout}
        />
      )}
      
      <Routes>
        <Route path="/prehome" element={<PreHome />} />
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<RegistrationForm />} />
        <Route 
          path="/login" 
          element={
            <Login 
              setIsLoggedIn={setIsLoggedIn} 
              onLogin={handleLogin}
            />
          } 
        />
        <Route path="/password-reset" element={<PasswordReset />} />
        <Route path="/match" element={<MatchPetProfile />} />
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home
                showSearchModal={showSearchModal}
                setShowSearchModal={setShowSearchModal}
              />
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
        <Route
          path="/chat/:chatId"
          element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/community"
          element={
            <PrivateRoute>
              <CommunityPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/friends"
          element={
            <PrivateRoute>
              <FriendList />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;