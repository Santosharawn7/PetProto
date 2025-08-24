import React, { useEffect, useState } from "react";
import axios from "axios";
import { buildApiUrl } from "../../config/api";
import { getAuthToken } from "../../utils/auth";
import ItemUploader from "../ItemUploader"; // <-- NEW: bring in the uploader
import { 
  ShoppingBag, 
  Package, 
  Users, 
  TrendingUp, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff,
  AlertCircle,
  DollarSign,
  BarChart3,
  Plus,
  Search,
  Filter,
  Download
} from "lucide-react";

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900">Edit Product</h2>
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            onClick={onClose}
            aria-label="Close edit modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
              <input 
                name="name" 
                value={form.name || ""} 
                onChange={handleChange} 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                required 
                maxLength={100}
                placeholder="Enter product name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <input 
                name="category" 
                value={form.category || ""} 
                onChange={handleChange} 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                maxLength={50}
                placeholder="e.g., Dog Food, Cat Toys"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Price ($)</label>
              <input 
                name="price" 
                type="number" 
                step="0.01" 
                min="0.01" 
                value={form.price || ""} 
                onChange={handleChange} 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                required
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Quantity</label>
              <input 
                name="stock" 
                type="number" 
                min="0" 
                value={form.stock || ""} 
                onChange={handleChange} 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                required
                placeholder="0"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Image URL</label>
              <input 
                name="image_url" 
                value={form.image_url || ""} 
                onChange={handleChange} 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                maxLength={500}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea 
                name="description" 
                value={form.description || ""} 
                onChange={handleChange} 
                rows={4} 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none" 
                maxLength={1000}
                placeholder="Describe your product..."
              />
            </div>
          </div>
          
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Delete Product</h2>
              <p className="text-gray-500">This action cannot be undone</p>
            </div>
          </div>
          
          <p className="text-gray-700 mb-6">
            Are you sure you want to delete <span className="font-semibold text-gray-900">{product.name}</span>? 
            This will permanently remove the product and all associated data.
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Product
                </>
              )}
            </button>
          </div>
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
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // NEW: local uploader state (mirrors Header behavior)
  const [showUploader, setShowUploader] = useState(false);

  const openUploader = () => setShowUploader(true);
  const closeUploader = () => setShowUploader(false);
  const handleUploaded = () => {
    // refresh and close just like you'd expect
    fetchProducts();
    setShowUploader(false);
  };

  // Fetch owner-scoped products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await axios.get(buildApiUrl("/api/my-products"), {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Accept either { products: [...] } OR raw array [...]
      const raw = Array.isArray(res?.data?.products)
        ? res.data.products
        : Array.isArray(res?.data)
        ? res.data
        : [];

      const normalized = raw.map((p) => {
        const buyers = Array.isArray(p?.buyers) ? p.buyers : [];

        // Recompute sold from buyers if backend didn't (or returned 0)
        const soldFromBuyers = buyers.reduce(
          (sum, b) => sum + Number(b?.quantity ?? 0),
          0
        );

        return {
          id: p?.id ?? p?.product_id ?? p?._id,
          // tolerate "title" (older admin route) or "product_name"
          name: p?.name ?? p?.title ?? p?.product_name ?? "Unnamed",
          image_url: p?.image_url ?? p?.imageUrl ?? p?.image ?? "",
          category: p?.category ?? p?.cat ?? "",
          price: Number(p?.price ?? 0),
          stock: Number(p?.stock ?? p?.quantity ?? 0),
          // prefer backend "sold" but fall back to computed
          sold: Number(p?.sold ?? soldFromBuyers),
          buyers,
        };
      });

      setProducts(normalized);
    } catch (e) {
      console.error("fetchProducts failed:", e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const toggleDrawer = (productId) => {
    setActiveProductId((prevId) => (prevId === productId ? null : productId));
  };

  const handleEditClick = (product) => {
    setEditProduct(product);
    setEditModalOpen(true);
  };

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
      fetchProducts();
    } catch (err) {
      alert("Failed to delete product: " + (err.response?.data?.error || ""));
    } finally {
      setDeleting(false);
    }
  };

  // Statistics calculations
  const stats = {
    totalProducts: products.length,
    totalStock: products.reduce((sum, p) => sum + Number(p.stock || 0), 0),
    totalSold: products.reduce((sum, p) => sum + Number(p.sold || 0), 0),
    // Prefer revenue from buyers (sum of unit price * qty), fallback to sold * price
    totalRevenue: products.reduce((sum, p) => {
      const buyersRevenue = (p.buyers ?? []).reduce(
        (s, b) => s + Number(b?.price_paid ?? 0) * Number(b?.quantity ?? 0),
        0
      );
      const fallback = Number(p.sold || 0) * Number(p.price || 0);
      return sum + (buyersRevenue || fallback);
    }, 0),
    totalBuyers: products.reduce((sum, p) => sum + (p.buyers?.length || 0), 0),
    lowStockProducts: products.filter(p => Number(p.stock || 0) < 5).length
  };

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    (product.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUnits = (p) => {
    const s = Number(p.stock || 0);
    const sold = Number(p.sold || 0);
    return s + sold;
  };

  const soldPercent = (p) => {
    const total = totalUnits(p);
    if (total <= 0) return 0;
    return Math.min(100, Math.round((Number(p.sold || 0) / total) * 100));
  };

  const getStockStatus = (stock) => {
    const stockNum = Number(stock || 0);
    if (stockNum === 0) return { color: 'red', text: 'Out of Stock' };
    if (stockNum < 5) return { color: 'yellow', text: 'Low Stock' };
    return { color: 'green', text: 'In Stock' };
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-white/20 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6">
              <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                Inventory Dashboard
              </h1>
              <p className="text-gray-700 mt-1">Manage your pet shop products and track sales</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchProducts}
                className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg hover:bg-white/90 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M4 4v6h6M20 20v-6h-6M5.64 17.36A9 9 0 106.34 6.34" />
                </svg>
                Refresh
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg hover:bg-white/90 transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={openUploader} // <-- NEW: same behavior as header Add Product
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Total Products</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalProducts}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            {stats.lowStockProducts > 0 && (
              <div className="mt-3 flex items-center gap-1 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{stats.lowStockProducts} low stock</span>
              </div>
            )}
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Total Stock</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalStock.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">{stats.totalSold} sold</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">Total earnings</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Customers</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalBuyers}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">Total buyers</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20 mb-6">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-white/50 transition-colors">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No products found' : 'No products yet'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first product'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={openUploader} // <-- NEW
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Product
                  </button>
                )}
              </div>
            ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50/50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sales</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customers</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white/40 divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <React.Fragment key={product.id}>
                      <tr className="hover:bg-white/60 transition-colors">
                        {/* Product Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center" style={{display: product.image_url ? 'none' : 'flex'}}>
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-gray-900 truncate">{product.name}</div>
                              {/* tiny inline debug (optional) */}
                              <div className="text-[11px] text-gray-400 mt-0.5">
                                sold:{product.sold} • buyers:{product.buyers.length}
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                {product.category && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                    {product.category}
                                  </span>
                                )}
                                <span className="text-sm font-medium text-gray-900">${Number(product.price || 0).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Stock Status */}
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                getStockStatus(product.stock).color === 'red' ? 'bg-red-100 text-red-700' :
                                getStockStatus(product.stock).color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {product.stock || 0} units
                              </span>
                              <span className="text-xs text-gray-500">of {totalUnits(product)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  soldPercent(product) > 80 ? 'bg-red-500' :
                                  soldPercent(product) > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${soldPercent(product)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Sales */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="font-semibold text-gray-900">{product.sold || 0}</span>
                            <span className="text-sm text-gray-500">sold</span>
                          </div>
                        </td>

                        {/* Revenue */}
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900">
                            {(() => {
                              const buyersRevenue = (product.buyers ?? []).reduce(
                                (s, b) => s + Number(b?.price_paid ?? 0) * Number(b?.quantity ?? 0),
                                0
                              );
                              const fallback = Number(product.sold || 0) * Number(product.price || 0);
                              return `${(buyersRevenue || fallback).toFixed(2)}`;
                            })()}
                          </span>
                        </td>

                        {/* Customers */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-500" />
                            <span className="font-semibold text-gray-900">{product.buyers.length}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleDrawer(product.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View customers"
                            >
                              {activeProductId === product.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleEditClick(product)}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Edit product"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(product)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Customer Details */}
                      {activeProductId === product.id && (
                        <tr>
                          <td colSpan="6" className="px-6 pb-6 bg-gray-50/50">
                            <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm">
                              <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                  <Users className="w-5 h-5 text-blue-600" />
                                  Customer Details for {product.name}
                                  <span className="ml-auto text-sm font-medium text-gray-500">
                                    {product.buyers.length} {product.buyers.length === 1 ? 'customer' : 'customers'}
                                  </span>
                                </h3>
                              </div>

                              <div className="p-6">
                                {product.buyers.length === 0 ? (
                                  <div className="text-center py-8">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                      <Users className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500">No customers yet for this product</p>
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead className="bg-gray-50">
                                        <tr>
                                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order Details</th>
                                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment</th>
                                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-200">
                                        {product.buyers.map((buyer, idx) => (
                                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-4">
                                              <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                  <span className="text-sm font-semibold text-blue-600">
                                                    {buyer.buyer_name?.charAt(0)?.toUpperCase() || 'U'}
                                                  </span>
                                                </div>
                                                <div>
                                                  <div className="font-medium text-gray-900">{buyer.buyer_name || 'Unknown'}</div>
                                                  <div className="text-sm text-gray-500">Customer #{idx + 1}</div>
                                                </div>
                                              </div>
                                            </td>
                                            
                                            <td className="px-4 py-4">
                                              <div>
                                                <div className="font-medium text-gray-900">{buyer.product_name}</div>
                                                <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                                    Qty: {buyer.quantity}
                                                  </span>
                                                  <span className="text-gray-500">×</span>
                                                  <span>${Number(buyer.price_paid || 0).toFixed(2)}</span>
                                                </div>
                                              </div>
                                            </td>
                                            
                                            <td className="px-4 py-4">
                                              <div>
                                                <div className="font-semibold text-gray-900">
                                                  ${((Number(buyer.price_paid || 0) * Number(buyer.quantity || 1))).toFixed(2)}
                                                </div>
                                                <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                                  <DollarSign className="w-3 h-3" />
                                                  {buyer.payment_method || 'Unknown'}
                                                </div>
                                              </div>
                                            </td>
                                            
                                            <td className="px-4 py-4">
                                              <div className="text-sm">
                                                <div className="text-gray-900">{buyer.phone_number || 'No phone'}</div>
                                              </div>
                                            </td>
                                            
                                            <td className="px-4 py-4">
                                              <div className="text-sm text-gray-600 max-w-xs">
                                                <div className="truncate" title={buyer.location}>
                                                  {buyer.location || 'No location provided'}
                                                </div>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
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

      {/* NEW: Same uploader modal behavior as in Header/App */}
      {showUploader && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 relative">
            <button
              onClick={closeUploader}
              className="absolute top-3 right-4 text-gray-600 hover:text-black text-2xl"
              aria-label="Close uploader"
            >
              &times;
            </button>
            <ItemUploader onProductUpload={handleUploaded} />
          </div>
        </div>
      )}
    </div>
  );
}