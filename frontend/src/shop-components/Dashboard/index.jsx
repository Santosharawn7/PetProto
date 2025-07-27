import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { buildApiUrl } from "../../config/api";
import { getAuthToken, isPetShopOwner, getUserData } from "../../utils/auth";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [activeProductId, setActiveProductId] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }

    // Add a small delay to ensure localStorage is fully loaded
    setTimeout(() => {
      const userData = getUserData();
      const isPetOwner = isPetShopOwner();
      
      console.log("=== DASHBOARD DEBUG ===");
      console.log("Full userData:", userData);
      console.log("userType from userData:", userData?.userType);
      console.log("isPetShopOwner() result:", isPetOwner);
      console.log("localStorage userData:", localStorage.getItem("userData"));
      console.log("localStorage userToken:", localStorage.getItem("userToken"));
      console.log("======================");

      // If userData is null, try to refresh or redirect to login
      if (!userData) {
        console.log("No userData found, redirecting to login");
        navigate('/login');
        return;
      }

      // Check if user is pet shop owner
      if (!isPetOwner) {
        console.log("Access denied - not a pet shop owner");
        setForbidden(true);
        setAuthChecked(true);
        return;
      }

      console.log("Access granted - fetching dashboard data");

      // Fetch dashboard data with auth header
      axios
        .get(buildApiUrl("/api/admin/dashboard"), {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
          console.log("Dashboard data received:", res.data);
          setProducts(res.data);
        })
        .catch((error) => {
          console.error("Dashboard API error:", error);
          setProducts([]);
        });

      setAuthChecked(true);
    }, 100); // Small delay to ensure localStorage is ready

    // eslint-disable-next-line
  }, [navigate]);

  const toggleDrawer = (productId) => {
    setActiveProductId((prevId) => (prevId === productId ? null : productId));
  };

  if (!authChecked) {
    return (
      <div className="p-10 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  if (forbidden) {
    const userData = getUserData();
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">🚫 Access Forbidden</h1>
        <p className="text-gray-700">Only Pet Shop Owners can access the dashboard.</p>
        
        {/* DETAILED DEBUG INFO */}
        <div className="mt-6 p-4 bg-gray-100 rounded text-left text-sm max-w-2xl mx-auto">
          <strong>🐛 Debug Information:</strong>
          <div className="mt-2 space-y-2">
            <div><strong>getUserData():</strong> {userData ? 'Found' : 'null/undefined'}</div>
            <div><strong>userType:</strong> {userData?.userType || 'Not found'}</div>
            <div><strong>isPetShopOwner():</strong> {isPetShopOwner().toString()}</div>
            <div><strong>localStorage userData:</strong> {localStorage.getItem("userData") ? 'Exists' : 'Missing'}</div>
            <div><strong>localStorage userToken:</strong> {localStorage.getItem("userToken") ? 'Exists' : 'Missing'}</div>
            
            {userData && (
              <div className="mt-3">
                <strong>Full User Data:</strong>
                <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto">
                  {JSON.stringify(userData, null, 2)}
                </pre>
              </div>
            )}
          </div>
          
          <div className="mt-4 p-3 bg-yellow-100 rounded">
            <strong>💡 Possible Solutions:</strong>
            <ul className="mt-1 text-xs list-disc list-inside">
              <li>Try logging out and logging in again</li>
              <li>Clear browser cache and localStorage</li>
              <li>Check if your account type was updated in Firebase</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">📊 Inventory Dashboard</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="px-4 py-2">Image</th>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Stock</th>
              <th className="px-4 py-2">Sold</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan="5" className="py-6 text-center text-gray-500">
                  No products uploaded yet. Upload your first product!
                </td>
              </tr>
            )}
            {products.map((product) => (
              <React.Fragment key={product.id}>
                <tr className="border-t">
                  <td className="px-4 py-2">
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  </td>
                  <td className="px-4 py-2">{product.title}</td>
                  <td className="px-4 py-2">{product.stock}</td>
                  <td className="px-4 py-2">{product.sold}</td>
                  <td className="px-4 py-2">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => toggleDrawer(product.id)}
                    >
                      {activeProductId === product.id ? "Hide" : "View Buyers"}
                    </button>
                  </td>
                </tr>
                {activeProductId === product.id && (
                  <tr>
                    <td colSpan="5" className="px-4 pb-4">
                      <div className="bg-gray-50 p-4 border rounded-md">
                        <h3 className="text-lg font-semibold mb-2">
                          🧾 Buyers for {product.title}
                        </h3>
                        {product.buyers.length === 0 ? (
                          <p className="text-gray-500">No purchases yet.</p>
                        ) : (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left bg-gray-200">
                                <th className="p-2">Buyer Name</th>
                                <th className="p-2">Product</th>
                                <th className="p-2">Quantity</th>
                                <th className="p-2">Total Paid</th>
                                <th className="p-2">Payment</th>
                                <th className="p-2">Phone</th>
                                <th className="p-2">Location</th>
                              </tr>
                            </thead>
                            <tbody>
                              {product.buyers.map((b, idx) => (
                                <tr key={idx} className="border-t">
                                  <td className="p-2">{b.buyer_name}</td>
                                  <td className="p-2">{b.product_name}</td>
                                  <td className="p-2">{b.quantity}</td>
                                  <td className="p-2">
                                    ${(b.price_paid * b.quantity).toFixed(2)}
                                  </td>
                                  <td className="p-2">{b.payment_method}</td>
                                  <td className="p-2">{b.phone_number}</td>
                                  <td className="p-2 whitespace-pre-line">{b.location}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}