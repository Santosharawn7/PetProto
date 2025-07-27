import { useState } from 'react';
import axios from 'axios';
import { buildApiUrl } from "../../config/api";;
import { getAuthToken } from '../../utils/auth';

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

  const isFormValid = Object.values(form).every((val) => val.trim() !== '');

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
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};

      const response = await axios.post(buildApiUrl('/api/orders'), {
        session_id: sessionId,
        shipping_address,
        buyer_name: form.fullName
      }, config);

      onOrderComplete(response.data);
    } catch (err) {
      console.error('Failed to place order:', err.message);
      setError('Order could not be placed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Checkout</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-100 text-red-700 border border-red-400 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            <div className="space-y-2 text-sm">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.product.name} x {item.quantity}</span>
                  <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 font-bold text-base">
                Total: ${totalPrice}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full Name" className="w-full border p-2 rounded" required />
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone Number" className="w-full border p-2 rounded" required />
            <input name="address" value={form.address} onChange={handleChange} placeholder="Street Address" className="w-full border p-2 rounded" required />
            <input name="city" value={form.city} onChange={handleChange} placeholder="City" className="w-full border p-2 rounded" required />
            <input name="province" value={form.province} onChange={handleChange} placeholder="Province/State" className="w-full border p-2 rounded" required />
            <input name="postalCode" value={form.postalCode} onChange={handleChange} placeholder="Postal/ZIP Code" className="w-full border p-2 rounded" required />
            <input name="country" value={form.country} onChange={handleChange} placeholder="Country" className="w-full border p-2 rounded" required />

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              } text-white`}
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
