import { useState, useEffect } from 'react';
import axios from 'axios';
import { buildApiUrl } from "../../config/api"; // Adjust if needed
import { getAuthToken } from '../../utils/auth'; // Optional, adjust path as needed

const Cart = ({ sessionId, onClose, onCheckout }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      const token = getAuthToken();
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};
      await axios.put(buildApiUrl(`/api/cart/${itemId}`), { quantity: newQuantity }, config);
      fetchCartItems();
    } catch (err) {
      console.error('Failed to update cart item:', err.message);
    }
  };

  const removeItem = async (itemId) => {
    try {
      const token = getAuthToken();
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};
      await axios.delete(buildApiUrl(`/api/cart/${itemId}`), config);
      fetchCartItems();
    } catch (err) {
      console.error('Failed to remove item from cart:', err.message);
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0).toFixed(2);
  };

  const handleCheckout = () => {
    onCheckout(cartItems, getTotalPrice());
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">Loading cart...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Shopping Cart</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && <div className="text-red-500 mb-4">{error}</div>}

          {cartItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-lg">Your cart is empty</div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 border-b pb-4">
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.product.name}</h3>
                    <p className="text-green-600 font-bold">${item.product.price}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="bg-gray-200 px-2 py-1 rounded">-</button>
                    <span className="px-3">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="bg-gray-200 px-2 py-1 rounded">+</button>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${(item.product.price * item.quantity).toFixed(2)}</p>
                    <button onClick={() => removeItem(item.id)} className="text-red-500 text-sm hover:text-red-700">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xl font-bold">Total: ${getTotalPrice()}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
