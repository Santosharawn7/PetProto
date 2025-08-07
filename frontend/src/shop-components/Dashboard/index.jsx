import React, { useEffect, useState } from "react";
import axios from "axios";
import { buildApiUrl } from "../../config/api";
import { getAuthToken, isPetShopOwner, getUserData } from "../../utils/auth";

// -- Edit Modal Component --
function EditProductModal({ open, product, onClose, onSave }) {
  const [form, setForm] = useState(product || {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(product || {});
    setError("");
  }, [product, open]);

  if (!open || !product) return null;

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const token = getAuthToken();
      await axios.put(buildApiUrl(`/api/products/${product.id}`), form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onSave();
      onClose();
    } catch (err) {
      setError("Failed to save product: " + (err.response?.data?.error || ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 relative animate-fadeIn">
        <button
          className="absolute top-3 right-4 text-2xl text-gray-500 hover:text-red-600"
          onClick={onClose}
          aria-label="Close edit modal"
        >✕</button>
        <h2 className="text-2xl font-bold mb-4">Edit Product</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold">Name</label>
            <input name="name" value={form.name || ""} onChange={handleChange} className="w-full border p-2 rounded" required maxLength={100} />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Category</label>
            <input name="category" value={form.category || ""} onChange={handleChange} className="w-full border p-2 rounded" maxLength={50} />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Price ($)</label>
            <input name="price" type="number" step="0.01" min="0.01" value={form.price || ""} onChange={handleChange} className="w-full border p-2 rounded" required />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Stock</label>
            <input name="stock" type="number" min="0" value={form.stock || ""} onChange={handleChange} className="w-full border p-2 rounded" required />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Image URL</label>
            <input name="image_url" value={form.image_url || ""} onChange={handleChange} className="w-full border p-2 rounded" maxLength={500} />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Description</label>
            <textarea name="description" value={form.description || ""} onChange={handleChange} rows={3} className="w-full border p-2 rounded" maxLength={1000} />
          </div>
          {error && <div className="text-red-600">{error}</div>}
          <div className="flex gap-4 justify-end mt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 px-5 py-2 rounded hover:bg-gray-300"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-800"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -- Delete Confirm Modal --
function DeleteProductConfirm({ open, product, onCancel, onConfirm, loading }) {
  if (!open || !product) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-8 relative animate-fadeIn">
        <h2 className="text-xl font-bold mb-4 text-red-600">Confirm Delete</h2>
        <p className="mb-6">
          Are you sure you want to <span className="font-semibold">delete</span> <span className="font-bold">{product.name}</span>?
        </p>
        <div className="flex gap-4 justify-end">
          <button
            onClick={onCancel}
            className="bg-gray-200 px-5 py-2 rounded hover:bg-gray-300"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 text-white px-5 py-2 rounded hover:bg-red-800"
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- MAIN DASHBOARD ----
export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [activeProductId, setActiveProductId] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Use `/api/my-products` so only products by logged-in owner are shown
  const fetchProducts = async () => {
    try {
      const token = getAuthToken();
      const res = await axios.get(buildApiUrl("/api/my-products"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      // If response shape is {products: [...], count: ...}
      setProducts((res.data.products && Array.isArray(res.data.products)) ? res.data.products : []);
    } catch (e) {
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
  }, []);

  const toggleDrawer = (productId) => {
    setActiveProductId((prevId) => (prevId === productId ? null : productId));
  };

  // -- Edit product handler
  const handleEditClick = (product) => {
    setEditProduct(product);
    setEditModalOpen(true);
  };

  // -- Delete product handler
  const handleDeleteClick = (product) => {
    setDeleteProduct(product);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProduct) return;
    setDeleting(true);
    try {
      const token = getAuthToken();
      await axios.delete(buildApiUrl(`/api/products/${deleteProduct.id}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteModalOpen(false);
      setDeleteProduct(null);
      fetchProducts(); // Refresh
    } catch (err) {
      alert("Failed to delete product: " + (err.response?.data?.error || ""));
    } finally {
      setDeleting(false);
    }
  };

  // ----------- UI RENDER -----------
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
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  </td>
                  <td className="px-4 py-2">{product.name}</td>
                  <td className="px-4 py-2">{product.stock}</td>
                  <td className="px-4 py-2">{product.sold || 0}</td>
                  <td className="px-4 py-2 flex gap-2 items-center">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => toggleDrawer(product.id)}
                    >
                      {activeProductId === product.id ? "Hide" : "View Buyers"}
                    </button>
                    <button
                      className="text-yellow-600 hover:underline ml-2"
                      onClick={() => handleEditClick(product)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:underline ml-2"
                      onClick={() => handleDeleteClick(product)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                {activeProductId === product.id && (
                  <tr>
                    <td colSpan="5" className="px-4 pb-4">
                      <div className="bg-gray-50 p-4 border rounded-md">
                        <h3 className="text-lg font-semibold mb-2">
                          🧾 Buyers for {product.name}
                        </h3>
                        {product.buyers && product.buyers.length === 0 ? (
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
                              {product.buyers && product.buyers.map((b, idx) => (
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

      {/* --- Modals --- */}
      <EditProductModal
        open={editModalOpen}
        product={editProduct}
        onClose={() => setEditModalOpen(false)}
        onSave={fetchProducts}
      />
      <DeleteProductConfirm
        open={deleteModalOpen}
        product={deleteProduct}
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />
    </div>
  );
}
