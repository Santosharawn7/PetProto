import { useState, useEffect } from 'react';
import axios from 'axios';
import { buildApiUrl } from "../../config/api";
import { MdPets } from "react-icons/md";
import { FaShoppingCart } from "react-icons/fa";

const ItemProductList = ({ category = '', searchTerm = '', onAddToCart }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
  }, [category, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(buildApiUrl('/api/products'));
      let filteredProducts = response.data || [];

      if (category) {
        filteredProducts = filteredProducts.filter(
          (p) => p.category && p.category.toLowerCase() === category.toLowerCase()
        );
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        filteredProducts = filteredProducts.filter(
          (p) =>
            p.name?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q)
        );
      }

      setProducts(filteredProducts);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err?.message || err);
      setProducts([]);
      setError('Failed to load products from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    if (product.stock === 0) return; // UI disables button anyway
    onAddToCart(product);
  };

  if (loading) return (
    <div className="flex justify-center items-center py-16">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">Loading products...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center py-16">
      <div className="text-center text-red-500 bg-red-50 rounded-lg p-6 border border-red-200">
        <p className="text-lg font-semibold">{error}</p>
      </div>
    </div>
  );

  if (products.length === 0) return (
    <div className="flex justify-center items-center py-16">
      <div className="text-center text-gray-500 bg-gray-50 rounded-lg p-8 border border-gray-200">
        <MdPets className="text-6xl text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-semibold">No products found</p>
        <p className="text-sm mt-2">Upload something new to get started!</p>
      </div>
    </div>
  );

  const safePrice = (p) => {
    const n = Number(p?.price);
    return Number.isFinite(n) ? n.toFixed(2) : "0.00";
  };

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-7xl">
        {/* Centered grid container */}
        <div className="flex justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 p-4 sm:p-6 w-full max-w-none">
            {products.map((product) => (
              <div
                key={product.id}
                className="group relative bg-white/90 backdrop-blur-lg border border-white/30 rounded-3xl shadow-2xl p-6 sm:p-8 transition-all duration-300 transform hover:scale-105 hover:shadow-3xl mx-auto w-full min-w-[320px] max-w-[400px]"
              >
                {/* Top-left Badge - Fixed z-index */}
                <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 z-20 transition-all duration-300 group-hover:scale-110">
                  <MdPets className="inline-block text-sm" />
                  <span className="hidden sm:inline">Pet Favorite</span>
                  <span className="sm:hidden">🐾</span>
                </div>

                {/* Top-right Stock badge - Fixed z-index */}
                {product.stock === 0 ? (
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg z-20 transition-all duration-300 group-hover:scale-110">
                    Out of Stock
                  </div>
                ) : (
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-green-100 to-green-200 text-green-800 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg z-20 transition-all duration-300 group-hover:scale-110">
                    In Stock
                  </div>
                )}

                {/* Image */}
                <div className="w-full h-64 sm:h-72 rounded-2xl overflow-hidden mb-6 border shadow-md relative">
                  <img
                    src={product.image_url || "https://via.placeholder.com/600x400?text=Product"}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  {/* Image overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <h3 className="text-black font-bold text-lg sm:text-xl truncate group-hover:text-purple-700 transition-colors duration-300">
                    {product.name}
                  </h3>

                  {product.category && (
                    <div>
                      <span className="inline-block text-xs font-semibold bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-200">
                        {product.category}
                      </span>
                    </div>
                  )}

                  <p className="text-black/80 text-sm leading-relaxed line-clamp-3 min-h-[3.75rem]">
                    {product.description || "No description provided."}
                  </p>

                  {/* Price and Stock */}
                  <div className="flex items-center justify-between py-2">
                    <span className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      ${safePrice(product)}
                    </span>
                    <span className="text-sm text-black/70 bg-gray-100 px-2 py-1 rounded-full">
                      Stock: {product.stock}
                    </span>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 transform active:scale-95
                      ${product.stock === 0
                        ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                        : 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                      }`}
                    title={product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  >
                    <FaShoppingCart className={`transition-transform duration-300 ${product.stock === 0 ? '' : 'group-hover:scale-110'}`} />
                    <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Show message if there are products but filtered result is empty */}
        {products.length > 0 && (category || searchTerm) && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">
              {category && !searchTerm && `No products found in category: "${category}"`}
              {searchTerm && !category && `No products found for: "${searchTerm}"`}
              {searchTerm && category && `No products found for "${searchTerm}" in category "${category}"`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemProductList;