// src/components/shop/Header.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { buildApiUrl } from "../../config/api";
import { getCurrentUser } from '../../services/userService';
import {
  FaPaw,
  FaArrowLeft,
  FaSearch,
  FaShoppingCart,
  FaPlus,
  FaTachometerAlt,
  FaStore,
  FaBars,
  FaTimes,
  FaUserCircle,     // <-- added
} from 'react-icons/fa';
import { MdPets } from 'react-icons/md';
import { FiLogOut } from 'react-icons/fi';

const Header = ({
  onSearch,
  onCategoryChange,
  cartItemCount,
  onCartClick,
  onAddProductClick,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState(['All Categories']);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (token) {
        const response = await getCurrentUser(token);
        let type = null;
        if (response.data.userType) type = response.data.userType;
        else if (response.data.user_type) type = response.data.user_type;
        else if (response.data.type) type = response.data.type;
        else if (response.data.user?.userType) type = response.data.user.userType;
        else if (response.data.user?.user_type) type = response.data.user.user_type;
        setUserType(type);
      }
    } catch {
      setUserType(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(buildApiUrl('/api/categories'));
      setCategories(['All Categories', ...response.data]);
    } catch {
      // ignore
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleBackToPetHome = () => {
    navigate('/home');
  };

  const handleUserProfile = () => {
    navigate('/profile');
  };

  const isPetParent = () => {
    if (!userType) return false;
    const normalizedType = userType.toString().toLowerCase().replace(/[^a-z]/g, '');
    return normalizedType === 'petparent';
  };

  const isPetShopOwnerCheck = () => {
    if (!userType) return false;
    const normalizedType = userType.toString().toLowerCase().replace(/[^a-z]/g, '');
    return normalizedType === 'petshopowner';
  };

  const getDisplayUserType = () => {
    if (!userType) return 'Unknown';
    const type = userType.toString().toLowerCase();
    if (['pet_parent', 'petparent', 'pet parent'].includes(type)) return 'Pet Parent';
    if (['pet_shop_owner', 'petshopowner', 'pet shop owner'].includes(type)) return 'Pet Shop Owner';
    return userType.toString().charAt(0).toUpperCase() + userType.toString().slice(1);
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* header inherits page background */}
      <header className="relative z-10 text-white shadow-2xl backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          {isPetParent() && (
            <div className="mb-4 sm:mb-6 animate-fadeIn">
              <button
                onClick={handleBackToPetHome}
                className="group flex items-center gap-2 sm:gap-3 bg-purple-600/80 hover:bg-purple-500/90 backdrop-blur-sm text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-400/30 hover:border-purple-300/50 transform hover:scale-105"
              >
                <div className="p-1 sm:p-2 bg-purple-500/50 rounded-full group-hover:bg-purple-400/60 transition-colors duration-300">
                  <FaArrowLeft className="text-xs sm:text-sm group-hover:-translate-x-1 transition-transform duration-300" />
                </div>
                <div className="p-1 sm:p-2 bg-pink-500/50 rounded-full group-hover:bg-pink-400/60 transition-colors duration-300">
                  <FaPaw className="text-xs sm:text-sm group-hover:rotate-12 transition-transform duration-300" />
                </div>
                <span className="font-bold text-xs sm:text-sm">Back to Pet Home</span>
              </button>
            </div>
          )}

          <div className="bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/20 shadow-2xl">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <a href="/shop" className="group flex items-center gap-2 sm:gap-4 flex-1">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl sm:rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <FaStore className="text-lg sm:text-2xl text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 bg-clip-text text-transparent truncate">
                    🐾 Pet Paradise
                  </h1>
                  <p className="text-purple-200 text-xs sm:text-sm font-medium hidden sm:block">Your Pet's Dream Store</p>
                </div>
              </a>

              {/* Mobile menu & cart */}
              <div className="flex items-center gap-2 sm:hidden">
                <button
                  onClick={onCartClick}
                  className="relative bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white p-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <FaShoppingCart className="text-lg" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse shadow-lg">
                      {cartItemCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/30 hover:bg-white/30 transition-all duration-300"
                >
                  {mobileMenuOpen ? <FaTimes className="text-lg" /> : <FaBars className="text-lg" />}
                </button>
              </div>

              {/* Desktop buttons */}
              <div className="hidden sm:flex items-center gap-3 lg:gap-4">
                <div className="bg-white/20 backdrop-blur-sm px-3 lg:px-4 py-2 rounded-xl border border-white/30">
                  <span className="text-xs lg:text-sm font-medium text-white">
                    {getDisplayUserType()}
                  </span>
                </div>

                {isPetShopOwnerCheck() && (
                  <>
                    <button
                      onClick={onAddProductClick}
                      className="group relative bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-3 lg:px-6 py-2 lg:py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-1 lg:gap-2"
                    >
                      <FaPlus className="text-sm lg:text-lg group-hover:rotate-90 transition-transform duration-300" />
                      <span className="text-xs lg:text-sm">Add</span>
                    </button>

                    <a
                      href="/shop/dashboard"
                      className="group relative bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-3 lg:px-6 py-2 lg:py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-1 lg:gap-2"
                    >
                      <FaTachometerAlt className="text-sm lg:text-lg" />
                      <span className="text-xs lg:text-sm">Dashboard</span>
                    </a>

                    {/* NEW: User Profile (only for pet_shop_owner) */}
                    <button
                      onClick={handleUserProfile}
                      className="group relative bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-3 lg:px-6 py-2 lg:py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-1 lg:gap-2"
                    >
                      <FaUserCircle className="text-sm lg:text-lg" />
                      <span className="text-xs lg:text-sm">My Profile</span>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="group relative bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-3 lg:px-6 py-2 lg:py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-1 lg:gap-2"
                    >
                      <FiLogOut className="text-sm lg:text-lg" />
                      <span className="text-xs lg:text-sm">Logout</span>
                    </button>
                  </>
                )}

                <button
                  onClick={onCartClick}
                  className="group relative bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-1 lg:gap-2"
                >
                  <FaShoppingCart className="text-sm lg:text-lg" />
                  <span className="text-xs lg:text-sm">Cart</span>
                  {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse shadow-lg">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
              <div className="sm:hidden mb-4 bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30 animate-fadeIn">
                <div className="space-y-3">
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30 text-center">
                    <span className="text-sm font-medium text-white">{getDisplayUserType()}</span>
                  </div>

                  {isPetShopOwnerCheck() && (
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => {
                          onAddProductClick();
                          setMobileMenuOpen(false);
                        }}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
                      >
                        <FaPlus className="text-lg" />
                        <span>Add Product</span>
                      </button>

                      <a
                        href="/shop/dashboard"
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <FaTachometerAlt className="text-lg" />
                        <span>Dashboard</span>
                      </a>

                      {/* NEW: User Profile in mobile menu */}
                      <button
                        onClick={() => {
                          handleUserProfile();
                          setMobileMenuOpen(false);
                        }}
                        className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
                      >
                        <FaUserCircle className="text-lg" />
                        <span>My Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
                      >
                        <FiLogOut className="text-lg" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Search + categories */}
            <div className="bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/30">
              <div className="space-y-3 sm:space-y-0 sm:flex sm:gap-4">
                <div className="flex-1">
                  <form onSubmit={handleSearchSubmit}>
                    <div className="flex rounded-xl sm:rounded-2xl overflow-hidden shadow-lg">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search pet products..."
                          className="w-full px-3 sm:px-4 py-3 sm:py-4 text-gray-800 bg-white/95 focus:outline-none focus:ring-2 focus:ring-yellow-400/70 transition-all duration-300 placeholder-gray-500 font-medium text-sm sm:text-base pr-10 sm:pr-12"
                        />
                        <MdPets className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-base sm:text-xl" />
                      </div>
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-3 sm:px-6 py-3 sm:py-4 font-bold shadow-lg hover:shadow-xl flex items-center justify-center min-w-[50px] sm:min-w-[120px]"
                      >
                        <FaSearch className="text-sm sm:text-base" />
                        <span className="hidden sm:inline ml-2">Search</span>
                      </button>
                    </div>
                  </form>
                </div>

                <div className="relative sm:min-w-[180px] lg:min-w-[220px]">
                  <select
                    onChange={(e) =>
                      onCategoryChange(e.target.value === 'All Categories' ? '' : e.target.value)
                    }
                    className="appearance-none w-full px-3 sm:px-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-gray-800 bg-white/95 focus:outline-none focus:ring-2 focus:ring-purple-400/70 font-medium shadow-lg cursor-pointer hover:bg-white transition-all duration-300 text-sm sm:text-base pr-10"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category} className="font-medium bg-white">
                        {category.length > 20 ? `${category.substring(0, 17)}...` : category}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 sm:px-3 pointer-events-none">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Header;
