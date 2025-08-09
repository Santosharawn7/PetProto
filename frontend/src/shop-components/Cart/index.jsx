import { useState, useEffect } from 'react';
import axios from 'axios';
import { buildApiUrl } from "../../config/api";
import { getAuthToken } from '../../utils/auth';
import { FaShoppingCart, FaTimes, FaPlus, FaMinus, FaTrash, FaPaw, FaHeart } from 'react-icons/fa';
import { MdPets, MdShoppingBag } from 'react-icons/md';

const Cart = ({ sessionId, onClose, onCheckout }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingItem, setRemovingItem] = useState(null);
  const [updatingItem, setUpdatingItem] = useState(null);

  useEffect(() => {
    fetchCartItems();
    // eslint-disable-next-line
  }, [sessionId]);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};
      const response = await axios.get(buildApiUrl(`/api/cart/${sessionId}`), config);
      setCartItems(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch cart from backend:', err.message);
      setCartItems([]);
      setError('Unable to load your cart.');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      setUpdatingItem(itemId);
      const token = getAuthToken();
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};
      await axios.put(buildApiUrl(`/api/cart/${itemId}`), { quantity: newQuantity }, config);
      await fetchCartItems(); // Make sure to wait for the fetch
    } catch (err) {
      console.error('Failed to update cart item:', err.message);
      setError('Failed to update item quantity. Please try again.');
    } finally {
      setUpdatingItem(null);
    }
  };

  // ENHANCED REMOVE FUNCTION WITH BETTER ERROR HANDLING AND LOGGING
  const removeItem = async (itemId) => {
    console.log('Remove button clicked for item:', itemId); // Debug log
    
    if (!itemId) {
      console.error('No itemId provided to removeItem function');
      setError('Unable to remove item: Invalid item ID');
      return;
    }

    try {
      setRemovingItem(itemId);
      setError(null); // Clear any previous errors
      
      const token = getAuthToken();
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};

      console.log('Making DELETE request to:', buildApiUrl(`/api/cart/${itemId}`)); // Debug log
      
      const response = await axios.delete(buildApiUrl(`/api/cart/${itemId}`), config);
      console.log('Delete response:', response.status, response.data); // Debug log
      
      // Refresh the cart items after successful deletion
      await fetchCartItems();
      
      console.log('Item removed successfully and cart refreshed'); // Debug log
    } catch (err) {
      console.error('Failed to remove item from cart:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      // Set a user-friendly error message
      if (err.response?.status === 404) {
        setError('Item not found. It may have already been removed.');
      } else if (err.response?.status === 401) {
        setError('You need to be logged in to remove items.');
      } else {
        setError('Failed to remove item. Please try again.');
      }
    } finally {
      setRemovingItem(null);
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0).toFixed(2);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCheckout = () => {
    onCheckout(cartItems, getTotalPrice());
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-12 border border-white/50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-6"></div>
            <p className="text-lg text-gray-700 font-semibold">Loading your cart...</p>
            <div className="flex items-center justify-center gap-2 mt-4 text-purple-600">
              <FaPaw className="animate-bounce" />
              <span className="text-sm">Fetching your pet goodies</span>
              <FaPaw className="animate-bounce delay-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white/50 animate-modalSlideIn">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <FaShoppingCart className="text-3xl text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-1">Shopping Cart</h2>
                <div className="flex items-center gap-2 text-white/90">
                  <MdPets className="text-lg" />
                  <span className="text-lg">{getTotalItems()} items in your cart</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="group p-3 bg-white/20 hover:bg-white/30 rounded-2xl transition-all duration-300 backdrop-blur-sm"
            >
              <FaTimes className="text-2xl text-white group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full max-h-[calc(90vh-200px)]">
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <FaHeart className="text-red-500" />
                  <span className="font-semibold">Oops!</span>
                </div>
                <p>{error}</p>
              </div>
            )}

            {cartItems.length === 0 ? (
              <div className="text-center py-16">
                <div className="mb-8">
                  <MdShoppingBag className="text-8xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h3>
                  <p className="text-gray-500 text-lg">Add some amazing pet products to get started!</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-purple-600">
                  <FaPaw className="animate-pulse" />
                  <span className="text-sm">Your pets are waiting for their treats</span>
                  <FaPaw className="animate-pulse delay-200" />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {cartItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`group bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
                      removingItem === item.id ? 'opacity-50 animate-pulse' : ''
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      {/* Product Image */}
                      <div className="relative">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-purple-200 shadow-lg">
                          <img
                            src={item.product.image_url || "https://via.placeholder.com/400x400?text=Product"}
                            alt={item.product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                          <FaPaw className="inline-block" />
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-700 transition-colors duration-300">
                          {item.product.name}
                        </h3>
                        {item.product.category && (
                          <span className="inline-block bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded-full border border-indigo-200 mb-3">
                            {item.product.category}
                          </span>
                        )}
                        <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          ${item.product.price}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center bg-gray-100 rounded-2xl p-1 border border-gray-200 shadow-inner">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updatingItem === item.id}
                            className="p-3 hover:bg-white hover:shadow-md rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                          >
                            <FaMinus className="text-gray-600 group-hover:text-purple-600 transition-colors duration-200" />
                          </button>
                          <span className="px-6 py-2 font-bold text-lg text-gray-800 min-w-[60px] text-center">
                            {updatingItem === item.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mx-auto"></div>
                            ) : (
                              item.quantity
                            )}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={updatingItem === item.id}
                            className="p-3 hover:bg-white hover:shadow-md rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                          >
                            <FaPlus className="text-gray-600 group-hover:text-purple-600 transition-colors duration-200" />
                          </button>
                        </div>
                      </div>

                      {/* Item Total & Remove - ENHANCED REMOVE BUTTON */}
                      <div className="text-center sm:text-right">
                        <div className="text-2xl font-bold text-gray-800 mb-3">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </div>
                        <button
                          onClick={() => {
                            console.log('Remove button clicked, item.id:', item.id); // Debug log
                            removeItem(item.id);
                          }}
                          disabled={removingItem === item.id}
                          className="group flex items-center justify-center gap-2 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 border border-red-200 hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          type="button" // Explicitly set button type
                        >
                          {removingItem === item.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              <span className="text-sm">Removing...</span>
                            </>
                          ) : (
                            <>
                              <FaTrash className="group-hover:scale-110 transition-transform duration-200" />
                              <span className="text-sm">Remove</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-center sm:text-left">
                  <div className="text-sm text-gray-600 mb-1">Total Amount</div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    ${getTotalPrice()}
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-500 text-sm mt-1">
                    <MdPets />
                    <span>for {getTotalItems()} amazing pet products</span>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  className="group relative bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-w-[200px]"
                >
                  <div className="flex items-center justify-center gap-3">
                    <FaShoppingCart className="text-xl group-hover:scale-110 transition-transform duration-300" />
                    <span>Proceed to Checkout</span>
                  </div>
                  <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        
        .animate-modalSlideIn {
          animation: modalSlideIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Cart;