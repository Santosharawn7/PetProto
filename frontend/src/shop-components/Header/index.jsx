// Header
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { buildApiUrl } from "../../config/api";
import { isPetShopOwner } from "../../utils/auth";
import { getCurrentUser } from "../../services/userService";
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
} from "react-icons/fa";
import { MdPets } from "react-icons/md";
import { FiLogOut } from "react-icons/fi";

const Header = ({
  onSearch,
  onCategoryChange,
  cartItemCount,
  onCartClick,
  onAddProductClick,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState(["All Categories"]);
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
      const response = await axios.get(buildApiUrl("/api/categories"));
      setCategories(["All Categories", ...response.data]);
    } catch (err) {
      // Ignore for now
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleBackToPetHome = () => {
    navigate("/home");
  };

  // Utility for pet parent
  const isPetParent = () => {
    if (!userType) return false;
    const normalizedType = userType
      .toString()
      .toLowerCase()
      .replace(/[^a-z]/g, "");
    const petParentVariations = [
      "petparent",
      "pet_parent",
      "Pet Parent",
      "petparent",
    ];
    for (const variation of petParentVariations) {
      if (userType.toString().toLowerCase() === variation.toLowerCase()) {
        return true;
      }
    }
    return normalizedType === "petparent";
  };

  // Utility for pet shop owner
  const isPetShopOwnerCheck = () => {
    if (!userType) return false;
    const normalizedType = userType
      .toString()
      .toLowerCase()
      .replace(/[^a-z]/g, "");
    const shopOwnerVariations = [
      "petshopowner",
      "pet_shop_owner",
      "Pet Shop Owner",
      "petshopowner",
    ];
    for (const variation of shopOwnerVariations) {
      if (userType.toString().toLowerCase() === variation.toLowerCase()) {
        return true;
      }
    }
    return normalizedType === "petshopowner";
  };

  // Display-friendly user type
  const getDisplayUserType = () => {
    if (!userType) return "Unknown";
    const type = userType.toString().toLowerCase();
    if (
      type === "pet_parent" ||
      type === "petparent" ||
      type === "pet parent"
    ) {
      return "Pet Parent";
    } else if (
      type === "pet_shop_owner" ||
      type === "petshopowner" ||
      type === "pet shop owner"
    ) {
      return "Pet Shop Owner";
    }
    return (
      userType.toString().charAt(0).toUpperCase() + userType.toString().slice(1)
    );
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userData");
    navigate("/login");
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
        {/* Back Button for Pet Parents */}
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
              <span className="font-bold text-xs sm:text-sm">
                Back to Pet Home
              </span>
            </button>
          </div>
        )}

        {/* Main Header Content */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl md:rounded-none p-4 md:mx-1 md:px-10 sm:p-6 border border-white/20 shadow-2xl">
          {/* Top row with logo and mobile menu button */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <a
              href="/shop"
              className="group flex items-center gap-2 sm:gap-4 flex-1"
            >
              <div className="p-2 sm:p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl sm:rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <FaStore className="text-lg sm:text-2xl text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300 truncate">
                  🐾 Pet Paradise
                </h1>
                <p className="text-purple-200 text-xs sm:text-sm font-medium hidden sm:block">
                  Your Pet's Dream Store
                </p>
              </div>
            </a>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 sm:hidden">
              {/* Cart Button (always visible) */}
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

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/30 hover:bg-white/30 transition-all duration-300"
              >
                {mobileMenuOpen ? (
                  <FaTimes className="text-lg" />
                ) : (
                  <FaBars className="text-lg" />
                )}
              </button>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden sm:flex items-center gap-3 lg:gap-4">
              {/* User Type Indicator */}
              <div className="bg-white/20 backdrop-blur-sm px-3 lg:px-4 py-2 rounded-xl border border-white/30">
                <span className="text-xs lg:text-sm font-medium text-white">
                  {getDisplayUserType()}
                </span>
              </div>

              {/* Pet Shop Owner Buttons */}
              {isPetShopOwnerCheck() && (
                <>
                  <button
                    onClick={onAddProductClick}
                    className="group relative bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-3 lg:px-6 py-2 lg:py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-1 lg:gap-2"
                  >
                    <FaPlus className="text-sm lg:text-lg group-hover:rotate-90 transition-transform duration-300" />
                    <span className="text-xs lg:text-sm">Add</span>
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                  <a
                    href="/shop/dashboard"
                    className="group relative bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-3 lg:px-6 py-2 lg:py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-1 lg:gap-2"
                  >
                    <FaTachometerAlt className="text-sm lg:text-lg group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-xs lg:text-sm">Dashboard</span>
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </a>
                  <button
                    onClick={handleLogout}
                    className="group relative bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-3 lg:px-6 py-2 lg:py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-1 lg:gap-2"
                    title="Logout"
                  >
                    <FiLogOut className="text-sm lg:text-lg group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-xs lg:text-sm">Logout</span>
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </>
              )}

              {/* Desktop Cart Button */}
              <button
                onClick={onCartClick}
                className="group relative bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-1 lg:gap-2"
              >
                <FaShoppingCart className="text-sm lg:text-lg group-hover:scale-110 transition-transform duration-300" />
                <span className="text-xs lg:text-sm">Cart</span>
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse shadow-lg">
                    {cartItemCount}
                  </span>
                )}
                <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="sm:hidden mb-4 bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30 animate-fadeIn">
              <div className="space-y-3">
                {/* User Type Indicator */}
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30 text-center">
                  <span className="text-sm font-medium text-white">
                    {getDisplayUserType()}
                  </span>
                </div>

                {/* Pet Shop Owner Mobile Buttons */}
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

          {/* Search and Categories Section */}
          <div className="bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/30">
            <div className="space-y-3 sm:space-y-0 sm:flex sm:gap-4">
              {/* Search Form */}
              <div className="flex-1">
                <form onSubmit={handleSearchSubmit} className="group">
                  <div className="flex rounded-xl sm:rounded-2xl overflow-hidden shadow-lg">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search pet products..."
                        className="w-full px-3 sm:px-4 py-3 sm:py-4 text-gray-800 bg-white/95 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/70 focus:bg-white transition-all duration-300 placeholder-gray-500 font-medium text-sm sm:text-base pr-10 sm:pr-12"
                      />
                      <MdPets className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-base sm:text-xl" />
                    </div>
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-3 sm:px-6 py-3 sm:py-4 font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center min-w-[50px] sm:min-w-[120px]"
                    >
                      <FaSearch className="text-sm sm:text-base" />
                      <span className="hidden sm:inline ml-2">Search</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Category Selector */}
              <div className="relative sm:min-w-[180px] lg:min-w-[220px]">
                <select
                  onChange={(e) =>
                    onCategoryChange(
                      e.target.value === "All Categories" ? "" : e.target.value
                    )
                  }
                  className="appearance-none w-full px-3 sm:px-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-gray-800 bg-white/95 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-400/70 font-medium shadow-lg cursor-pointer hover:bg-white transition-all duration-300 text-sm sm:text-base pr-10"
                >
                  {categories.map((category) => (
                    <option
                      key={category}
                      value={category}
                      className="font-medium bg-white"
                    >
                      {category.length > 20
                        ? `${category.substring(0, 17)}...`
                        : category}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 sm:px-3 pointer-events-none">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Header;

