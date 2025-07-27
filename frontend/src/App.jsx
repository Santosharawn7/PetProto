import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// Main PetProto components
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

// Shop components
import ShopHeader from './shop-components/Header';
import ItemUploader from './shop-components/ItemUploader';
import ItemProductList from './shop-components/ItemProductList';
import Cart from './shop-components/Cart';
import Checkout from './shop-components/Checkout';
import Dashboard from './shop-components/Dashboard';
import { getSessionId } from './utils/sessionId';
import { buildApiUrl } from './config/api';

// Auth utils
import { isValidToken } from './utils/auth';
import RegistrationForm from './pages/Registration';
import Messages from './components/Message';

function AppContent() {
  // Main app state
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  // Shop state
  const [category, setCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState('0.00');
  const [sessionId] = useState(getSessionId());
  const [orderComplete, setOrderComplete] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showUploader, setShowUploader] = useState(false);

  // Auth check for the entire app
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    setIsLoggedIn(isValidToken(token));
    setIsLoading(false);
  }, [location.pathname]);

  useEffect(() => {
    // Cross-tab login/logout
    const handleStorageChange = (e) => {
      if (e.key === 'userToken') {
        setIsLoggedIn(isValidToken(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // SHOP: Fetch cart count
  useEffect(() => {
    fetchCartCount();
    // eslint-disable-next-line
  }, [sessionId]);

  const fetchCartCount = async () => {
    try {
      const response = await axios.get(buildApiUrl(`/api/cart/${sessionId}`));
      setCartItemCount(response.data.length);
    } catch (err) {
      setCartItemCount(0);
    }
  };

  // --- Shop handlers ---
  const handleAddToCart = async (product) => {
    try {
      await axios.post(buildApiUrl('/api/cart'), {
        product_id: product.id,
        quantity: 1,
        session_id: sessionId,
      });
      fetchCartCount();
      alert(`${product.name} added to cart!`);
    } catch {
      alert('Failed to add item to cart.');
    }
  };
  const handleSearch = (term) => setSearchTerm(term);
  const handleCategoryChange = (cat) => setCategory(cat);
  const handleCartClick = () => setShowCart(true);
  const handleCloseCart = () => setShowCart(false);
  const handleCheckout = (items, total) => {
    setCartItems(items);
    setTotalPrice(total);
    setShowCart(false);
    setShowCheckout(true);
  };
  const handleCloseCheckout = () => setShowCheckout(false);
  const handleOrderComplete = (order) => {
    setOrderComplete(order);
    setShowCheckout(false);
    fetchCartCount();
    setTimeout(() => {
      alert(`Order placed successfully! Order ID: ${order.id}`);
      setOrderComplete(null);
    }, 100);
  };
  const handleRefreshInventory = () => {
    setRefreshKey((prev) => prev + 1);
    setShowUploader(false);
  };

  // --- Auth/Logout ---
  const handleLogout = () => {
    localStorage.removeItem('userToken');
    setIsLoggedIn(false);
  };
  const handleLogin = (token) => {
    localStorage.setItem('userToken', token);
    setIsLoggedIn(true);
  };

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

  // ----- RENDER -----
  return (
    <>
      {/* Main PetProto header */}
      {isLoggedIn && !location.pathname.startsWith('/shop') && (
        <Header
          onSearchClick={() => setShowSearchModal(true)}
          setIsLoggedIn={setIsLoggedIn}
          onLogout={handleLogout}
        />
      )}

      {/* Shop header, always shown on shop routes */}
      {location.pathname.startsWith('/shop') && (
        <ShopHeader
          onSearch={handleSearch}
          onCategoryChange={handleCategoryChange}
          cartItemCount={cartItemCount}
          onCartClick={handleCartClick}
          onAddProductClick={() => setShowUploader(true)}
        />
      )}

      <Routes>
        {/* --- PetProto routes --- */}
        <Route path="/prehome" element={<PreHome />} />
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<RegistrationForm />} />
        <Route
          path="/login"
          element={
            <Login
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
              <Home showSearchModal={showSearchModal} setShowSearchModal={setShowSearchModal} />
            </PrivateRoute>
          }
        />
        <Route path="/survey" element={<PrivateRoute><SurveyPage /></PrivateRoute>} />
        <Route path="/pet-profile" element={<PrivateRoute><PetProfile /></PrivateRoute>} />
        <Route path="/edit-pet" element={<PrivateRoute><EditPetProfile /></PrivateRoute>} />
        <Route path="/update_registration" element={<PrivateRoute><UpdateRegistration /></PrivateRoute>} />
        <Route path="/message" element={<PrivateRoute><Messages/></PrivateRoute>} />
        <Route path="/chat/:chatId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="/community" element={<PrivateRoute><CommunityPage /></PrivateRoute>} />
        <Route path="/friends" element={<PrivateRoute><FriendList /></PrivateRoute>} />

        {/* --- Shop Routes --- */}
        <Route
          path="/shop"
          element={
            <PrivateRoute>
              <>
                <div className="mb-6 mt-6">
                  {category && (
                    <p className="text-lg text-gray-600">
                      Category: <span className="font-semibold">{category}</span>
                    </p>
                  )}
                  {searchTerm && (
                    <p className="text-lg text-gray-600">
                      Search results for: <span className="font-semibold">"{searchTerm}"</span>
                    </p>
                  )}
                </div>
                <ItemProductList
                  key={refreshKey}
                  category={category}
                  searchTerm={searchTerm}
                  onAddToCart={handleAddToCart}
                />
              </>
            </PrivateRoute>
          }
        />
        <Route
          path="/shop/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        {/* Add more shop subroutes as needed */}

        {/* Fallback: redirect unknown routes to / */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Shop Modals */}
      {showCart && location.pathname.startsWith('/shop') && (
        <Cart
          sessionId={sessionId}
          onClose={handleCloseCart}
          onCheckout={handleCheckout}
        />
      )}

      {showCheckout && location.pathname.startsWith('/shop') && (
        <Checkout
          cartItems={cartItems}
          totalPrice={totalPrice}
          sessionId={sessionId}
          onClose={handleCloseCheckout}
          onOrderComplete={handleOrderComplete}
        />
      )}

      {showUploader && location.pathname.startsWith('/shop') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 relative">
            <button
              onClick={() => setShowUploader(false)}
              className="absolute top-3 right-4 text-gray-600 hover:text-black text-2xl"
            >
              &times;
            </button>
            <ItemUploader onProductUpload={handleRefreshInventory} />
          </div>
        </div>
      )}
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
