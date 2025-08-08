import { useState, useEffect } from 'react';
import axios from 'axios';
import { buildApiUrl } from "../../config/api";
import { MdPets } from "react-icons/md";
import { FaShoppingCart } from "react-icons/fa";

const ItemProductList = ({ category = '', searchTerm = '', onAddToCart }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, [category, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(buildApiUrl('/api/products'));
      let filteredProducts = response.data;

      if (category) {
        filteredProducts = filteredProducts.filter(
          (p) => p.category && p.category.toLowerCase() === category.toLowerCase()
        );
      }

      if (searchTerm) {
        filteredProducts = filteredProducts.filter((p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setProducts(filteredProducts);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err.message);
      setProducts([]);
      setError('Failed to load products from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    if (product.stock === 0) return;
    onAddToCart(product);
  };

  if (loading) return <div className="text-center py-10 text-lg">Loading products...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
  if (products.length === 0) return <div className="text-center py-10 text-gray-500">No products found. Upload something new!</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 p-4">
      {products.map(product => (
        <div
          key={product.id}
          className="group relative bg-white backdrop-blur-lg border border-white/30 rounded-3xl shadow-2xl p-4 transition-transform transform hover:scale-105"
        >
          {/* Top Badge */}
          <div className="absolute top-3 left-3 bg-yellow-300 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow">
            <MdPets className="inline-block mr-1" />
            Pet Favorite
          </div>

          {/* Image */}
          <div className="w-full h-48 rounded-2xl overflow-hidden mb-4 border shadow-md">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300"
            />
          </div>

          {/* Details */}
          <h3 className="text-black font-bold text-lg truncate mb-1">{product.name}</h3>
          <p className="text-black text-sm line-clamp-2 mb-2">{product.description}</p>

          {/* Price and Stock */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl font-bold text-green-600">${product.price}</span>
            <span className="text-sm text-black">Stock: {product.stock}</span>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={() => handleAddToCart(product)}
            disabled={product.stock === 0}
            className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-semibold text-sm transition-all duration-300
              ${product.stock === 0
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg'
              }`}
          >
            <FaShoppingCart />
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      ))}
    </div>
  );
};

export default ItemProductList;

