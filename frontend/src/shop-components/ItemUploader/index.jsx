import { useState, useEffect } from 'react';
import axios from 'axios';
import { buildApiUrl } from "../../config/api";
import { getAuthToken, getUserData } from '../../utils/auth';

const ItemUploader = ({ onProductUpload }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category: '',
    stock: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});

  // Valid pet shop owner types - using consistent backend format
  const validOwnerTypes = [
    'pet_shop_owner',      // Primary backend format (this is what your user has!)
    'Pet Shop Owner',      // Display format
    'petshopowner',        // Normalized
    'shopowner',           // Short version
    'owner'                // Very short version
  ];

  // Enhanced check function that works with userData parameter
  const checkIsPetShopOwnerWithData = (userData) => {
    console.log('🔍 ItemUploader: Starting pet shop owner check');
    console.log('📋 ItemUploader: Input userData:', userData);
    
    if (!userData) {
      console.log('❌ ItemUploader: No userData provided');
      return false;
    }

    if (!userData.userType) {
      console.log('❌ ItemUploader: No userType found in userData');
      console.log('📋 ItemUploader: Available userData keys:', Object.keys(userData));
      return false;
    }

    const rawUserType = userData.userType;
    console.log('🎯 ItemUploader: Checking userType:', rawUserType, '(type:', typeof rawUserType, ')');

    // Direct match check first (most reliable)
    const directMatch = validOwnerTypes.includes(rawUserType);
    console.log('🔍 ItemUploader: Direct match result:', directMatch);
    
    if (directMatch) {
      console.log('✅ ItemUploader: Direct match found for userType:', rawUserType);
      return true;
    }

    // Case-insensitive direct match
    const caseInsensitiveMatch = validOwnerTypes.some(type => 
      type.toLowerCase() === rawUserType.toLowerCase()
    );
    console.log('🔍 ItemUploader: Case-insensitive match result:', caseInsensitiveMatch);
    
    if (caseInsensitiveMatch) {
      console.log('✅ ItemUploader: Case-insensitive match found for userType:', rawUserType);
      return true;
    }

    // Normalized check for flexibility (remove spaces, underscores, special chars)
    const normalizedUserType = rawUserType.toLowerCase().replace(/[^a-z]/g, '');
    const normalizedValidTypes = validOwnerTypes.map(type =>
      type.toLowerCase().replace(/[^a-z]/g, '')
    );

    const normalizedMatch = normalizedValidTypes.includes(normalizedUserType);
    console.log('🔍 ItemUploader: Normalized check:', {
      original: rawUserType,
      normalized: normalizedUserType,
      validNormalized: normalizedValidTypes,
      result: normalizedMatch
    });

    if (normalizedMatch) {
      console.log('✅ ItemUploader: Normalized match found');
      return true;
    }

    console.log('❌ ItemUploader: No match found for userType:', rawUserType);
    return false;
  };

  // Function to refresh user data from backend
  const refreshUserData = async () => {
    console.log('🔄 ItemUploader: Refreshing user data from backend');
    const token = getAuthToken();
    if (!token) {
      console.log('❌ ItemUploader: No auth token available for refresh');
      return null;
    }

    try {
      // Import getCurrentUser dynamically to avoid circular dependencies
      const { getCurrentUser } = await import('../../services/userService');
      const response = await getCurrentUser(token);
      
      console.log('📡 ItemUploader: Backend response:', response);
      
      if (response && response.data) {
        const userData = response.data;
        localStorage.setItem("userData", JSON.stringify(userData));
        console.log('✅ ItemUploader: Refreshed and saved user data:', userData);
        return userData;
      }
    } catch (error) {
      console.error('❌ ItemUploader: Failed to refresh user data:', error);
    }
    return null;
  };

  // Check authentication and authorization on component mount
  useEffect(() => {
    console.log('🚀 ItemUploader: Starting authentication check');
    
    let attempts = 0;
    const maxAttempts = 10;
    const retryDelay = 300;

    const checkAuth = async () => {
      attempts++;
      console.log(`🔄 ItemUploader: Auth check attempt ${attempts}/${maxAttempts}`);

      // Get current auth state
      const token = getAuthToken();
      let userData = getUserData();
      
      console.log('🔍 ItemUploader: Current auth state:', {
        hasToken: !!token,
        hasUserData: !!userData,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'None',
        userDataKeys: userData ? Object.keys(userData) : []
      });

      // If no userData but we have a token, try to refresh from backend
      if (!userData && token) {
        console.log('🔄 ItemUploader: No local userData, attempting backend refresh');
        userData = await refreshUserData();
      }

      if (userData) {
        console.log('✅ ItemUploader: Found userData:', userData);
        
        // Perform pet shop owner check
        const isPetOwner = checkIsPetShopOwnerWithData(userData);
        
        // Store debug information
        const debug = {
          userData: userData,
          userType: userData.userType,
          displayUserType: userData.displayUserType,
          isPetOwner: isPetOwner,
          validTypes: validOwnerTypes,
          hasToken: !!token,
          attempt: attempts
        };
        
        console.log('📊 ItemUploader: Final authorization result:', debug);
        
        setUserInfo(userData);
        setHasAccess(isPetOwner);
        setAuthChecked(true);
        setDebugInfo(debug);
        
        return;
      }

      // Retry if we haven't reached max attempts
      if (attempts < maxAttempts) {
        console.log(`⏳ ItemUploader: Retrying auth check in ${retryDelay}ms...`);
        setTimeout(checkAuth, retryDelay);
      } else {
        console.log('❌ ItemUploader: Max auth attempts reached, denying access');
        const debug = {
          userData: null,
          userType: null,
          displayUserType: null,
          isPetOwner: false,
          validTypes: validOwnerTypes,
          hasToken: !!token,
          attempt: attempts,
          maxAttemptsReached: true
        };
        
        setHasAccess(false);
        setAuthChecked(true);
        setDebugInfo(debug);
      }
    };

    checkAuth();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Product name is required');
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Please enter a valid price greater than 0');
      return false;
    }
    if (!formData.stock || parseInt(formData.stock, 10) < 0) {
      setError('Please enter a valid stock quantity (0 or more)');
      return false;
    }
    if (formData.image_url && !isValidUrl(formData.image_url)) {
      setError('Please enter a valid image URL');
      return false;
    }
    return true;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    console.log('📤 ItemUploader: Starting product upload');

    // Validate form
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Double-check authorization before submitting
      const currentUserData = getUserData();
      console.log('🔍 ItemUploader: Pre-submit auth check:', currentUserData);
      
      if (!checkIsPetShopOwnerWithData(currentUserData)) {
        throw new Error('Access denied. Only Pet Shop Owners can upload products.');
      }

      const payload = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        image_url: formData.image_url.trim() || null
      };

      console.log('📦 ItemUploader: Submitting product payload:', payload);

      const response = await axios.post(
        buildApiUrl('/api/upload-item'),
        payload,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ ItemUploader: Upload successful:', response.data);

      setMessage('Product uploaded successfully! 🎉');
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: '',
        image_url: '',
        category: '',
        stock: ''
      });

      // Notify parent component
      if (onProductUpload) {
        onProductUpload();
      }

    } catch (err) {
      console.error('❌ ItemUploader: Upload error:', err);
      
      let errorMessage = 'Failed to upload product. Please try again.';
      
      if (err.response) {
        const status = err.response.status;
        const errorData = err.response.data;
        
        switch (status) {
          case 400:
            errorMessage = errorData?.message || 'Invalid product data. Please check all fields.';
            break;
          case 401:
            errorMessage = 'Authentication failed. Please log in again.';
            // Clear invalid token
            localStorage.removeItem('userToken');
            localStorage.removeItem('userData');
            break;
          case 403:
            errorMessage = 'Access denied. Only Pet Shop Owners can upload products.';
            break;
          case 409:
            errorMessage = 'A product with this name already exists. Please use a different name.';
            break;
          case 413:
            errorMessage = 'Product data is too large. Please reduce image size or description length.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = errorData?.message || `Error ${status}: ${err.response.statusText}`;
        }
      } else if (err.request) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Manual retry function for debugging
  const handleManualRetry = async () => {
    console.log('🔄 ItemUploader: Manual retry triggered');
    setAuthChecked(false);
    setError(null);
    setMessage(null);
    
    // Try to refresh user data
    const userData = await refreshUserData();
    const isPetOwner = checkIsPetShopOwnerWithData(userData);
    
    const debug = {
      userData: userData,
      userType: userData?.userType,
      displayUserType: userData?.displayUserType,
      isPetOwner: isPetOwner,
      validTypes: validOwnerTypes,
      hasToken: !!getAuthToken(),
      manualRetry: true,
      timestamp: new Date().toISOString()
    };
    
    setUserInfo(userData);
    setHasAccess(isPetOwner);
    setAuthChecked(true);
    setDebugInfo(debug);
    
    console.log('🔄 ItemUploader: Manual retry complete:', debug);
  };

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Checking authorization...</span>
        </div>
        
        {/* Debug info during loading */}
        <div className="mt-4 p-3 bg-blue-50 rounded text-xs">
          <strong>🔍 Auth Check Progress:</strong>
          <div className="mt-1">
            <div>Token: {getAuthToken() ? '✅ Present' : '❌ Missing'}</div>
            <div>LocalStorage userData: {localStorage.getItem("userData") ? '✅ Present' : '❌ Missing'}</div>
          </div>
        </div>
      </div>
    );
  }

  // Block access for non-pet-shop-owners
  if (!hasAccess) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 max-w-2xl mx-auto">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-700 mb-4">
            Only Pet Shop Owners can upload new products to the store.
          </p>
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <button
              onClick={handleManualRetry}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              🔄 Retry Authorization Check
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              🔃 Refresh Page
            </button>
          </div>
          
          {/* Enhanced Debug info */}
          <div className="mt-6 p-4 bg-gray-100 rounded text-left text-sm">
            <strong>🔍 Detailed Debug Information:</strong>
            <div className="mt-2 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Authentication:</strong>
                  <div className="text-xs mt-1 space-y-1">
                    <div>Auth token: {getAuthToken() ? '✅ Present' : '❌ Missing'}</div>
                    <div>LocalStorage userData: {localStorage.getItem("userData") ? '✅ Present' : '❌ Missing'}</div>
                    <div>User found: {userInfo ? '✅ Yes' : '❌ No'}</div>
                  </div>
                </div>
                
                <div>
                  <strong>User Information:</strong>
                  <div className="text-xs mt-1 space-y-1">
                    <div>Raw userType: {debugInfo.userType || 'Not found'}</div>
                    <div>Display userType: {debugInfo.displayUserType || 'Not found'}</div>
                    <div>Access granted: {debugInfo.isPetOwner ? '✅ Yes' : '❌ No'}</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 p-2 bg-white rounded">
                <strong>Valid Pet Shop Owner Types:</strong>
                <div className="text-xs mt-1 flex flex-wrap gap-1">
                  {validOwnerTypes.map(type => (
                    <span key={type} className={`px-2 py-1 rounded text-xs ${
                      debugInfo.userType === type ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {type}
                    </span>
                  ))}
                </div>
              </div>
              
              {debugInfo.userData && (
                <div className="mt-3 p-2 bg-yellow-50 rounded">
                  <strong>🗂️ Raw User Data (from your console):</strong>
                  <pre className="text-xs mt-1 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(debugInfo.userData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded text-xs">
              <strong>💡 Expected vs Actual:</strong>
              <div className="mt-1">
                <div>Your console shows: <code>userType: "pet_shop_owner"</code></div>
                <div>This should match: <code>pet_shop_owner</code> ✅</div>
                <div>If you see this message, there might be a data loading issue.</div>
              </div>
            </div>
            
            <div className="mt-3 p-2 bg-yellow-100 rounded text-xs">
              <strong>🛠️ Troubleshooting Steps:</strong>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Click "Retry Authorization Check" button above</li>
                <li>If that fails, click "Refresh Page"</li>
                <li>Check if you're logged in as the correct user</li>
                <li>Verify your user type in the console with getUserData()</li>
                <li>Clear browser cache if the issue persists</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <span className="text-2xl mr-2">📦</span>
        Add New Product
        <span className="ml-2 text-sm font-normal text-gray-500">
          (✅ Authorized: {userInfo?.displayUserType || userInfo?.userType})
        </span>
      </h2>
      
      {/* Success indicator */}
      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
        <div className="flex items-center text-green-800">
          <span className="text-lg mr-2">✅</span>
          <strong>Access Granted!</strong>
        </div>
        <div className="text-green-700 text-xs mt-1">
          User type: <code>{userInfo?.userType}</code> | 
          Display: <code>{userInfo?.displayUserType}</code>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter product name"
              className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              required
              disabled={loading}
              maxLength={100}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="e.g., Dog Food, Cat Toys, Bird Supplies"
              className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              disabled={loading}
              maxLength={50}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price ($) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              max="9999.99"
              className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Quantity *
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              placeholder="0"
              min="0"
              max="9999"
              className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              required
              disabled={loading}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image URL
          </label>
          <input
            type="url"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
            placeholder="https://example.com/product-image.jpg"
            className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional: Enter a direct link to your product image
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your product features, benefits, and specifications..."
            className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            rows={4}
            disabled={loading}
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.description.length}/1000 characters
          </p>
        </div>
        
        <button
          type="submit"
          className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
            loading
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg transform hover:scale-[1.02]'
          }`}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Uploading Product...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <span className="mr-2">📤</span>
              Upload Product
            </span>
          )}
        </button>
      </form>
      
      {message && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          <div className="flex items-center">
            <span className="text-xl mr-2">✅</span>
            {message}
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex items-center">
            <span className="text-xl mr-2">❌</span>
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemUploader;