import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { buildApiUrl } from "../../config/api";
import { isPetShopOwner } from '../../utils/auth';
import { getCurrentUser } from '../../services/userService';
import { FaPaw, FaArrowLeft, FaSearch, FaShoppingCart, FaPlus, FaTachometerAlt, FaStore } from 'react-icons/fa';
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
        if (response.data.userType) {
          type = response.data.userType;
        } else if (response.data.user_type) {
          type = response.data.user_type;
        } else if (response.data.type) {
          type = response.data.type;
        } else if (response.data.user && response.data.user.userType) {
          type = response.data.user.userType;
        } else if (response.data.user && response.data.user.user_type) {
          type = response.data.user.user_type;
        }
        setUserType(type);
      }
    } catch (error) {
      setUserType(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(buildApiUrl('/api/categories'));
      setCategories(['All Categories', ...response.data]);
    } catch (err) {
      // Ignore for now
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleBackToPetHome = () => {
    navigate('/home');
  };

  // Utility for pet parent
  const isPetParent = () => {
    if (!userType) return false;
    const normalizedType = userType.toString().toLowerCase().replace(/[^a-z]/g, '');
    const petParentVariations = [
      'petparent', 'pet_parent', 'Pet Parent', 'petparent'
    ];
    for (const variation of petParentVariations) {
      if (userType.toString().toLowerCase() === variation.toLowerCase()) {
        return true;
      }
    }
    return normalizedType === 'petparent';
  };

  // Utility for pet shop owner
  const isPetShopOwnerCheck = () => {
    if (!userType) return false;
    const normalizedType = userType.toString().toLowerCase().replace(/[^a-z]/g, '');
    const shopOwnerVariations = [
      'petshopowner', 'pet_shop_owner', 'Pet Shop Owner', 'petshopowner'
    ];
    for (const variation of shopOwnerVariations) {
      if (userType.toString().toLowerCase() === variation.toLowerCase()) {
        return true;
      }
    }
    return normalizedType === 'petshopowner';
  };

  // Display-friendly user type
  const getDisplayUserType = () => {
    if (!userType) return 'Unknown';
    const type = userType.toString().toLowerCase();
    if (type === 'pet_parent' || type === 'petparent' || type === 'pet parent') {
      return 'Pet Parent';
    } else if (type === 'pet_shop_owner' || type === 'petshopowner' || type === 'pet shop owner') {
      return 'Pet Shop Owner';
    }
    return userType.toString().charAt(0).toUpperCase() + userType.toString().slice(1);
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-[200px] bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-20 h-20 bg-purple-400 rounded-full opacity-10 animate-pulse"></div>
          <div className="absolute top-1/4 right-20 w-16 h-16 bg-pink-400 rounded-full opacity-15 animate-bounce"></div>
          <div className="absolute bottom-10 left-1/4 w-12 h-12 bg-indigo-400 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute top-1/2 right-1/3 w-8 h-8 bg-purple-300 rounded-full opacity-10 animate-ping"></div>
        </div>
      </div>

      <header className="relative z-10 text-white shadow-2xl backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          {/* Back Button for Pet Parents */}
          {isPetParent() && (
            <div className="mb-6 animate-fadeIn">
              <button
                onClick={handleBackToPetHome}
                className="group flex items-center gap-3 bg-purple-600/80 hover:bg-purple-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-400/30 hover:border-purple-300/50 transform hover:scale-105"
              >
                <div className="p-2 bg-purple-500/50 rounded-full group-hover:bg-purple-400/60 transition-colors duration-300">
                  <FaArrowLeft className="text-sm group-hover:-translate-x-1 transition-transform duration-300" />
                </div>
                <div className="p-2 bg-pink-500/50 rounded-full group-hover:bg-pink-400/60 transition-colors duration-300">
                  <FaPaw className="text-sm group-hover:rotate-12 transition-transform duration-300" />
                </div>
                <span className="font-bold text-sm">Back to Pet Home</span>
              </button>
            </div>
          )}

          {/* Main Header Content */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-2xl">
            {/* Top row with logo and action buttons */}
            <div className="flex items-center justify-between mb-6">
              <a href="/shop" className="group flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <FaStore className="text-2xl text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                    🐾 Pet Paradise
                  </h1>
                  <p className="text-purple-200 text-sm font-medium">Your Pet's Dream Store</p>
                </div>
              </a>

              <div className="flex items-center gap-4">
                {/* User Type Indicator */}
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30">
                  <span className="text-sm font-medium text-white">
                    {getDisplayUserType()}
                  </span>
                </div>

                {/* Pet Shop Owner Buttons */}
                {isPetShopOwnerCheck() && (
                  <>
                    <button
                      onClick={onAddProductClick}
                      className="group relative bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                    >
                      <FaPlus className="text-lg group-hover:rotate-90 transition-transform duration-300" />
                      <span>Add Product</span>
                      <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                    <a
                      href="/shop/dashboard"
                      className="group relative bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                    >
                      <FaTachometerAlt className="text-lg group-hover:scale-110 transition-transform duration-300" />
                      <span>Dashboard</span>
                      <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </a>
                    <button
                      onClick={handleLogout}
                      className="group relative bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2 ml-2"
                      title="Logout"
                    >
                      <FiLogOut className="text-lg group-hover:scale-110 transition-transform duration-300" />
                      <span>Logout</span>
                      <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </>
                )}

                {/* Cart Button */}
                <button
                  onClick={onCartClick}
                  className="group relative bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                >
                  <FaShoppingCart className="text-lg group-hover:scale-110 transition-transform duration-300" />
                  <span>Cart</span>
                  {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse shadow-lg">
                      {cartItemCount}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
            </div>

            {/* Search and Categories Section */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Form */}
                <form onSubmit={handleSearchSubmit} className="flex-1 flex group">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search for amazing pet products..."
                      className="w-full px-6 py-4 rounded-l-2xl text-gray-800 bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-yellow-400/50 focus:bg-white transition-all duration-300 placeholder-gray-500 font-medium shadow-inner"
                    />
                    <MdPets className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                  </div>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-4 rounded-r-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                  >
                    <FaSearch className="text-lg" />
                    <span className="hidden sm:inline">Search</span>
                  </button>
                </form>

                {/* Category Selector */}
                <div className="relative">
                  <select
                    onChange={(e) =>
                      onCategoryChange(e.target.value === 'All Categories' ? '' : e.target.value)
                    }
                    className="appearance-none px-6 py-4 rounded-2xl text-gray-800 bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-purple-400/50 font-medium shadow-lg cursor-pointer hover:bg-white transition-all duration-300 min-w-[200px]"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category} className="font-medium">
                        {category}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Custom Animations */}
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
