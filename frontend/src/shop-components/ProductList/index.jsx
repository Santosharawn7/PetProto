import { useState, useEffect } from 'react';
import axios from 'axios';
import { buildApiUrl } from "../../config/api";; // Adjust path if needed
import { isPetShopOwner } from '../../utils/auth'; // Adjust path if needed

const ProductList = ({ category, searchTerm, onAddToCart }) => {
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
      const params = {};
      if (category) params.category = category;
      if (searchTerm) params.search = searchTerm;

      const response = await axios.get(buildApiUrl('/api/products'), { params });
      // If your API returns { products: [...] }, otherwise just use response.data
      setProducts(response.data.products || response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err.message);
      setProducts([]);
      setError('Failed to load products from server.');
    } finally {
      setLoading(false);
    }
  };

  const petShopOwner = isPetShopOwner();

  const handleAddToCart = (product) => {
    if (petShopOwner) {
      onAddToCart(product);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">No products available. Add a new one!</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-48 object-cover"
          />
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
            <p className="text-gray-600 text-sm mb-2 line-clamp-3">{product.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-green-600">${product.price}</span>
              <span className="text-sm text-gray-500">Stock: {product.stock}</span>
            </div>
            <button
              onClick={() => handleAddToCart(product)}
              disabled={product.stock === 0 || !petShopOwner}
              className={`w-full mt-3 py-2 px-4 rounded-md font-medium transition-colors ${
                product.stock === 0 || !petShopOwner
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              title={
                product.stock === 0
                  ? 'Out of Stock'
                  : !petShopOwner
                  ? 'Only Pet Shop Owners can add to cart'
                  : ''
              }
            >
              {product.stock === 0
                ? 'Out of Stock'
                : !petShopOwner
                ? 'Login as Pet Shop Owner to Add to Cart'
                : 'Add to Cart'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductList;
