import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ItemUploader from '../ItemUploader';
import ItemProductList from '../ItemProductList';
import { getCurrentUser } from '../../services/userService';
import { FaPaw, FaArrowLeft, FaStore, FaShoppingCart, FaPlus, FaTimes } from 'react-icons/fa';
import { MdPets, MdInventory } from 'react-icons/md';

const SHOP_PATH = "/shop"; // Always treat /shop as home page

const DynamicHome = () => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showUploader, setShowUploader] = useState(false);
  const [userType, setUserType] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("userToken");
        if (token) {
          const response = await getCurrentUser(token);
          setUserData(response.data);
          const type = response.data.userType || response.data.user_type || response.data.type;
          setUserType(type);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setShowUploader(false);
  };

  const handleBackToPetHome = () => {
    navigate('/home');
  };

  // Check if user is pet parent (handle different possible values)
  const isPetParent = () => {
    if (!userType) return false;
    const type = userType.toLowerCase().replace(/[^a-z]/g, '');
    return type === 'petparent' || type === 'pet_parent' || type === 'parent';
  };

  // Check if user is pet shop owner
  const isPetShopOwnerCheck = () => {
    if (!userType) return false;
    const type = userType.toLowerCase().replace(/[^a-z]/g, '');
    return type === 'petshopowner' || type === 'pet_shop_owner' || type === 'shopowner' || type === 'owner';
  };

  if (loading) {
    // Inherit body background; no extra page background here
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-white/80">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="font-semibold">Loading your pet store...</p>
        </div>
      </div>
    );
  }

  return (
    // Inherit the body background — no page-level gradient or fixed overlays
    <div className="min-h-screen">
      <div className="relative z-10 p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Debug Info - Remove in production */}
        <div className="mb-4 p-3 bg-yellow-100/90 border border-yellow-300 rounded-lg text-sm">
          <p><strong>Debug Info:</strong></p>
          <p>UserType: {userType || 'null'}</p>
          <p>Is Pet Parent: {isPetParent() ? 'Yes' : 'No'}</p>
          <p>Is Pet Shop Owner: {isPetShopOwnerCheck() ? 'Yes' : 'No'}</p>
        </div>

        {/* Back to Pet Home Button - For Pet Parents */}
        {isPetParent() && (
          <div className="mb-8 animate-fadeIn flex justify-center">
            <button
              onClick={handleBackToPetHome}
              className="group flex items-center gap-3 bg-white hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 text-purple-700 px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-purple-200 hover:border-purple-300 transform hover:scale-105"
            >
              <div className="p-2 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors duration-300">
                <FaArrowLeft className="text-lg group-hover:-translate-x-1 transition-transform duration-300" />
              </div>
              <div className="p-2 bg-pink-100 rounded-full group-hover:bg-pink-200 transition-colors duration-300">
                <FaPaw className="text-lg group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <span className="font-bold text-lg">Back to Pet Home</span>
            </button>
          </div>
        )}

        {/* Welcome Header Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-6 sm:p-8 mb-8 border border-white/50 relative overflow-hidden">
          {/* Decorative elements (keep them inside the card only) */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-200 to-purple-200 rounded-full translate-y-12 -translate-x-12 opacity-50"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex-1 text-center lg:text-left">
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
                  <FaStore className="text-3xl text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    🐾 Pet Paradise Store
                  </h1>
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-gray-600">
                    <MdPets className="text-xl" />
                    <p className="text-base sm:text-lg">
                      {isPetShopOwnerCheck() 
                        ? "Manage your pet product inventory with ease" 
                        : "Discover amazing products for your beloved pets"
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full lg:w-auto">
              <button
                onClick={() => alert('Cart feature coming soon! 🛒')}
                className="group relative bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto min-w-[140px]"
              >
                <div className="flex items-center justify-center gap-3">
                  <FaShoppingCart className="text-xl group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-semibold text-lg">Cart</span>
                </div>
                <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              
              {isPetShopOwnerCheck() && (
                <button
                  onClick={() => setShowUploader(true)}
                  className="group relative bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto min-w-[180px]"
                >
                  <div className="flex items-center justify-center gap-3">
                    <FaPlus className="text-xl group-hover:rotate-90 transition-transform duration-300" />
                    <span className="font-semibold text-lg">Add Product</span>
                  </div>
                  <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Product Grid Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/50 relative overflow-hidden">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 mb-8 text-center sm:text-left">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
              <MdInventory className="text-2xl text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Product Collection</h2>
              <p className="text-gray-600">Browse our curated selection of pet products</p>
            </div>
          </div>

          {/* Product List Container */}
          <div className="relative">
            <div className="flex justify-center">
              <div className="w-full max-w-6xl">
                <ItemProductList
                  key={refreshKey}
                  onAddToCart={(product) => console.log('Add to cart:', product)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Modal Popup */}
        {showUploader && isPetShopOwnerCheck() && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative border border-white/50 animate-modalSlideIn">
              {/* Close Button */}
              <button
                className="absolute top-4 sm:top-6 right-4 sm:right-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 group z-10"
                onClick={() => setShowUploader(false)}
              >
                <FaTimes className="text-xl group-hover:rotate-90 transition-transform duration-300" />
              </button>
              
              {/* Modal Header */}
              <div className="mb-6 sm:mb-8 pr-12">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                    <FaPlus className="text-2xl text-white" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Add New Product</h2>
                    <p className="text-gray-600 text-base sm:text-lg">Expand your inventory with amazing pet products</p>
                  </div>
                </div>
              </div>
              
              {/* Modal Content */}
              <div className="relative">
                <ItemUploader onProductUpload={handleRefresh} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
        .animate-modalSlideIn { animation: modalSlideIn 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default DynamicHome;