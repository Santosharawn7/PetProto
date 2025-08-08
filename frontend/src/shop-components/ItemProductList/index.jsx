import { useState, useEffect } from 'react';
import axios from 'axios';
import { buildApiUrl } from "../../config/api";

const ItemProductList = ({ category = '', searchTerm = '', onAddToCart }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
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
    if (product.stock === 0) return; // extra check, but UI disables button anyway
    onAddToCart(product);
  };

  if (loading) {
    return <div className="text-center py-10 text-lg">Loading products...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  if (products.length === 0) {
    return <div className="text-center py-10 text-gray-500">No products found. Upload something new!</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map(product => (
        <div
          key={product.id}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
        >
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-48 object-cover"
          />
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
            <p className="text-gray-600 text-sm mb-2 line-clamp-3">{product.description}</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-green-600">${product.price}</span>
              <span className="text-sm text-gray-500">Stock: {product.stock}</span>
            </div>
            <button
              onClick={() => handleAddToCart(product)}
              disabled={product.stock === 0}
              className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                product.stock === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              title={product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            >
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ItemProductList;
