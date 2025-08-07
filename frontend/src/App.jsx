import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Landing from "./components/Landing";
import Login from "./pages/Login";
import PrivateRoute from "./PrivateRoute";
import Home from "./pages/Home";
import PetProfile from "./pages/PetProfile";
import UpdateRegistration from "./pages/UpdateRegistration";
import MatchPetProfile from "./components/MatchPetProfile";
import PasswordReset from "./pages/PasswordReset";
import SurveyPage from "./components/Survey";
import EditPetProfile from "./pages/EditPetProfile";
import CommunityPage from "./components/CommunityPage";
import FriendList from "./components/FriendList";
import PreHome from "./components/Prehome";
import Header from "./components/Header";
import RegistrationForm from './pages/Registration';

import ShopHeader from "./shop-components/Header";
import ItemUploader from "./shop-components/ItemUploader";
import ItemProductList from "./shop-components/ItemProductList";
import Cart from "./shop-components/Cart";
import Checkout from "./shop-components/Checkout";
import Dashboard from "./shop-components/Dashboard";
import { getSessionId } from "./utils/sessionId";
import { buildApiUrl } from "./config/api";
import { isValidToken } from './utils/auth';

// --- Chat UI ---
import MiniChatModal from "./components/MiniChatModal";
import ChatFloater from "./components/ChatFloater";
import ChatFloaterIcon from "./components/ChatFloaterIcon";
import ChatModal from "./components/ChatModal";
import Message from "./components/Message";

// --- New Profile Pages ---
import UserProfile from "./pages/UserProfile";
import UserProfileEdit from "./pages/UserProfileEdit";

// --- Mobile Chat ---
import MobileChatView from "./components/MobileChatView";
import MobileChat from "./components/MobileChat";
import OmniverseLandingPage from "./pages/DesktopLandingPage";

function AppContent() {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  // Floater/modal for chat
  const [floaterOpen, setFloaterOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);

  // --- Mobile Chat State ---
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [mobileChatFriend, setMobileChatFriend] = useState(null);
  const [mobileChatId, setMobileChatId] = useState(null);

  // --- Shop state ---
  const [category, setCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState("0.00");
  const [sessionId] = useState(getSessionId());
  const [orderComplete, setOrderComplete] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showUploader, setShowUploader] = useState(false);

  // Detect mobile: use a hook or just inline for simplicity
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    setIsLoggedIn(isValidToken(token));
    setIsLoading(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "userToken") {
        setIsLoggedIn(isValidToken(e.newValue));
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    fetchCartCount();
    // eslint-disable-next-line
  }, [sessionId]);

  const fetchCartCount = async () => {
    try {
      const response = await fetch(buildApiUrl(`/api/cart/${sessionId}`));
      const data = await response.json();
      setCartItemCount(data.length);
    } catch (err) {
      setCartItemCount(0);
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await fetch(buildApiUrl("/api/cart"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          quantity: 1,
          session_id: sessionId,
        }),
      });
      fetchCartCount();
      alert(`${product.name} added to cart!`);
    } catch {
      alert("Failed to add item to cart.");
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

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    setIsLoggedIn(false);
  };
  const handleLogin = (token) => {
    localStorage.setItem("userToken", token);
    setIsLoggedIn(true);
  };

  // ---- MOBILE CHAT LOGIC ----

  // Set a global function so Header can open mobile chat
  useEffect(() => {
    window.openMobileChat = () => {
      setMobileChatOpen(true);
      setMobileChatFriend(null);
      setMobileChatId(null);
    };
    return () => { window.openMobileChat = undefined; };
  }, []);

  // Select a friend in mobile chat, lookup or create chatId
  const handleMobileChatSelectFriend = async (friend) => {
    try {
      const { auth } = await import("./firebase");
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      // Try to find or create chat
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || process.env.VITE_API_URL || 'http://127.0.0.1:5000'}/chats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { chats } = await res.json();
      let chat = (chats || []).find(
        c => !c.isGroup && c.participants && c.participants.includes(friend.uid)
      );
      if (!chat) {
        // Create new chat
        const createRes = await fetch(
          `${import.meta.env.VITE_API_URL || process.env.VITE_API_URL || 'http://127.0.0.1:5000'}/chats`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              participants: [user.uid, friend.uid],
              isGroup: false
            })
          }
        );
        const data = await createRes.json();
        chat = { id: data.chatId };
      }
      setMobileChatFriend(friend);
      setMobileChatId(chat.id);
    } catch (err) {
      alert("Unable to start chat. Please try again.");
    }
  };
  // Close mobile chat/friends list
  const handleMobileChatClose = () => {
    setMobileChatOpen(false);
    setMobileChatFriend(null);
    setMobileChatId(null);
  };
  // Go back to friend list from chat
  const handleMobileChatBack = () => {
    setMobileChatFriend(null);
    setMobileChatId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-orange-100 to-purple-100 flex justify-center items-center">
        Loading...
      </div>
    );
  }

  return (
    // MAIN WRAPPER WITH GRADIENT BACKGROUND FOR ALL PAGES
    <div className="min-h-screen bg-gradient-to-r from-orange-100 to-purple-100">
      {/* Main PetProto header */}
      {isLoggedIn && !location.pathname.startsWith("/shop") && (
        <Header
          onSearchClick={() => setShowSearchModal(true)}
          setIsLoggedIn={setIsLoggedIn}
          onLogout={handleLogout}
        />
      )}

      {/* Shop header, always shown on shop routes */}
      {location.pathname.startsWith("/shop") && (
        <ShopHeader
          onSearch={handleSearch}
          onCategoryChange={handleCategoryChange}
          cartItemCount={cartItemCount}
          onCartClick={handleCartClick}
          onAddProductClick={() => setShowUploader(true)}
        />
      )}

      {/* --------- MOBILE CHAT EXPERIENCE --------- */}
      {mobileChatOpen && isMobile && (
        !mobileChatFriend ?
          <MobileChatView
            onSelectFriend={handleMobileChatSelectFriend}
            onClose={handleMobileChatClose}
          />
        :
          <MobileChat
            friend={mobileChatFriend}
            chatId={mobileChatId}
            onBack={handleMobileChatBack}
          />
      )}

      <ScrollToTop />
      <Routes>
        {/* --- PetProto routes --- */}
        <Route path="/prehome" element={<PreHome />} />
        <Route path="/" element={<OmniverseLandingPage />} />
        <Route path="/register" element={<RegistrationForm />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
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
        {/* --- Profile Routes --- */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <UserProfile />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <PrivateRoute>
              <UserProfileEdit />
            </PrivateRoute>
          }
        />
        {/* --- Shop Routes --- */}
        <Route
          path="/shop"
          element={
            <PrivateRoute>
              <>
                <div className="mb-6 mt-6">
                  {category && (
                    <p className="text-lg text-gray-600">
                      Category:{" "}
                      <span className="font-semibold">{category}</span>
                    </p>
                  )}
                  {searchTerm && (
                    <p className="text-lg text-gray-600">
                      Search results for:{" "}
                      <span className="font-semibold">"{searchTerm}"</span>
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
      {showCart && location.pathname.startsWith("/shop") && (
        <Cart
          sessionId={sessionId}
          onClose={handleCloseCart}
          onCheckout={handleCheckout}
        />
      )}

      {showCheckout && location.pathname.startsWith("/shop") && (
        <Checkout
          cartItems={cartItems}
          totalPrice={totalPrice}
          sessionId={sessionId}
          onClose={handleCloseCheckout}
          onOrderComplete={handleOrderComplete}
        />
      )}

      {showUploader && location.pathname.startsWith("/shop") && (
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

      {/* --------- Chat Floater Icon, Floater, and Full Modal --------- */}
      {isLoggedIn && (
        <>
          {/* Floater Icon, desktop only */}
          {!floaterOpen && !chatModalOpen && (
            <div className="hidden md:block">
              <ChatFloaterIcon onClick={() => setFloaterOpen(true)} />
            </div>
          )}

          {/* MiniChatModal only on desktop, not mobile */}
          <MiniChatModal open={floaterOpen} onClose={() => setFloaterOpen(false)} onExpand={() => {
            setFloaterOpen(false);
            setChatModalOpen(true);
          }}>
            <ChatFloater
              onClose={() => setFloaterOpen(false)}
              onExpand={() => {
                setFloaterOpen(false);
                setChatModalOpen(true);
              }}
            />
          </MiniChatModal>

          {/* Messenger Modal */}
          <ChatModal open={chatModalOpen} onClose={() => setChatModalOpen(false)}>
            <Message />
          </ChatModal>
        </>
      )}
    </div>
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