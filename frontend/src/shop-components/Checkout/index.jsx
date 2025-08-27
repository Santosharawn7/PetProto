import React, { useState } from 'react';
import axios from 'axios';
import { buildApiUrl } from "../../config/api";
import { getAuthToken } from '../../utils/auth';
import {
  FaCreditCard, FaTimes, FaShoppingCart, FaPaw, FaUser, FaPhone,
  FaHome, FaCity, FaMapMarkerAlt, FaGlobe, FaLock
} from 'react-icons/fa';
import { MdPets, MdLocalShipping } from 'react-icons/md';

const Checkout = ({ cartItems, totalPrice, sessionId, onClose, onOrderComplete }) => {
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    country: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isFormValid = Object.values(form).every((val) => String(val || '').trim() !== '');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      setError('Please fill out all fields.');
      return;
    }

    const shipping_address = `
${form.phone}
${form.address}
${form.city}, ${form.province}, ${form.postalCode}
${form.country}`.trim();

    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const { data } = await axios.post(
        buildApiUrl('/api/orders'),
        {
          session_id: sessionId,
          shipping_address,
          buyer_name: form.fullName
        },
        config
      );

      // Be tolerant to backend shape: accept data.id or data.order.id
      const orderId = data?.id ?? data?.order?.id ?? null;

      onOrderComplete({ id: orderId, ...data });
    } catch (err) {
      console.error('Failed to place order:', err);
      setError(err?.response?.data?.error || 'Order could not be placed.');
    } finally {
      setLoading(false);
    }
  };

  const formattedTotal = Number(totalPrice || 0).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden border border-white/50 animate-modalSlideIn">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10"></div>
          <div className="absolute top-4 right-4 w-16 h-16 bg-white/20 rounded-full"></div>
          <div className="absolute bottom-4 left-4 w-12 h-12 bg-white/10 rounded-full"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <FaCreditCard className="text-3xl text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-1">Checkout</h2>
                <div className="flex items-center gap-2 text-white/90">
                  <MdPets className="text-lg" />
                  <span className="text-lg">Secure checkout for your pets</span>
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

        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl text-red-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <FaPaw className="text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Oops! Something went wrong</p>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="mb-8 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl p-6 border border-purple-100 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl">
                  <FaShoppingCart className="text-xl text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Order Summary</h3>
              </div>
              
              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-purple-200">
                        <img
                          src={item.product.image_url || "https://via.placeholder.com/200x200?text=Product"}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{item.product.name}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        ${(Number(item.product.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
                
                <div className="border-t-2 border-purple-200 pt-4 mt-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl border border-green-200">
                    <div className="flex items-center gap-2">
                      <MdPets className="text-2xl text-green-600" />
                      <span className="text-xl font-bold text-gray-800">Total Amount</span>
                    </div>
                    <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      ${formattedTotal}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Information Form */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-6 border border-blue-100 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                  <MdLocalShipping className="text-xl text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Shipping Information</h3>
                <div className="flex items-center gap-1 text-green-600 bg-green-100 px-3 py-1 rounded-full text-sm font-semibold">
                  <FaLock className="text-xs" />
                  <span>Secure</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaUser className="text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                    </div>
                    <input
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="Full Name"
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 bg-white/80 backdrop-blur-sm placeholder-gray-500"
                      required
                    />
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaPhone className="text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                    </div>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Phone Number"
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 bg-white/80 backdrop-blur-sm placeholder-gray-500"
                      required
                    />
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaHome className="text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                  </div>
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Street Address"
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 bg-white/80 backdrop-blur-sm placeholder-gray-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaCity className="text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                    </div>
                    <input
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="City"
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 bg-white/80 backdrop-blur-sm placeholder-gray-500"
                      required
                    />
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaMapMarkerAlt className="text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                    </div>
                    <input
                      name="province"
                      value={form.province}
                      onChange={handleChange}
                      placeholder="Province/State"
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 bg-white/80 backdrop-blur-sm placeholder-gray-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaMapMarkerAlt className="text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                    </div>
                    <input
                      name="postalCode"
                      value={form.postalCode}
                      onChange={handleChange}
                      placeholder="Postal/ZIP Code"
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 bg-white/80 backdrop-blur-sm placeholder-gray-500"
                      required
                    />
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaGlobe className="text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                    </div>
                    <input
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                      placeholder="Country"
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 bg-white/80 backdrop-blur-sm placeholder-gray-500"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`group relative w-full py-4 px-6 rounded-2xl font-bold text-lg shadow-lg transition-all duration-300 transform ${
                      loading 
                        ? 'bg-gray-400 cursor-not-allowed opacity-60' 
                        : 'bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 hover:shadow-xl hover:scale-105'
                    } text-white`}
                  >
                    <div className="flex items-center justify-center gap-3">
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          <span>Placing Order...</span>
                        </>
                      ) : (
                        <>
                          <FaLock className="text-xl group-hover:scale-110 transition-transform duration-300" />
                          <span>Place Secure Order</span>
                          <FaPaw className="text-xl group-hover:rotate-12 transition-transform duration-300" />
                        </>
                      )}
                    </div>
                    {!loading && (
                      <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mt-4">
                  <FaLock className="text-xs" />
                  <span>Your information is secure and encrypted</span>
                  <FaPaw className="text-xs animate-pulse" />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modalSlideIn {
          animation: modalSlideIn 0.4s ease-out;
        }
        input:focus { outline: none; }
      `}</style>
    </div>
  );
};

export default Checkout;
