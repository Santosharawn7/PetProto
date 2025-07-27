import { useState } from 'react';
import { getAuthToken } from '../../utils/auth';
import { getCurrentUser } from '../../services/userService';

const ManualUserDataFixer = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userData, setUserData] = useState(null);

  const token = getAuthToken();
  const existingUserData = localStorage.getItem("userData");

  const fetchAndFixUserData = async () => {
    if (!token) {
      setMessage('❌ No token found. Please log in again.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      console.log('Fetching user data with token...');
      const response = await getCurrentUser(token);
      
      if (response && response.data) {
        const fetchedUserData = response.data;
        console.log('Fetched user data:', fetchedUserData);
        
        // Store in localStorage
        localStorage.setItem("userData", JSON.stringify(fetchedUserData));
        setUserData(fetchedUserData);
        setMessage('✅ User data successfully restored to localStorage!');
        
        // Force page refresh after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage('❌ No user data returned from server.');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setMessage(`❌ Error: ${error.message || 'Failed to fetch user data'}`);
    } finally {
      setLoading(false);
    }
  };

  const clearAllAndRelogin = () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("userToken");
    setMessage('🔄 All data cleared. Please log in again.');
    // Redirect to login page
    setTimeout(() => {
      window.location.href = '/login'; // Adjust this path to your login route
    }, 1000);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 max-w-2xl mx-auto border-l-4 border-yellow-500">
      <h2 className="text-xl font-bold mb-4 text-yellow-600">🔧 User Data Recovery Tool</h2>
      
      <div className="space-y-4">
        {/* Current Status */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-bold text-gray-800 mb-2">Current Status:</h3>
          <div className="text-sm space-y-1">
            <div><strong>Token exists:</strong> {token ? '✅ Yes' : '❌ No'}</div>
            <div><strong>UserData exists:</strong> {existingUserData ? '✅ Yes' : '❌ No'}</div>
            {existingUserData && (
              <div><strong>UserData preview:</strong> {existingUserData.substring(0, 100)}...</div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={fetchAndFixUserData}
            disabled={loading || !token}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
              loading || !token
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Fetching User Data...
              </span>
            ) : (
              '🔄 Fetch & Restore User Data'
            )}
          </button>

          <button
            onClick={clearAllAndRelogin}
            className="w-full py-2 px-4 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-all duration-200"
          >
            🚪 Clear All & Re-login
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.includes('✅') 
              ? 'bg-green-100 border border-green-400 text-green-700'
              : message.includes('❌')
              ? 'bg-red-100 border border-red-400 text-red-700'
              : 'bg-blue-100 border border-blue-400 text-blue-700'
          }`}>
            {message}
          </div>
        )}

        {/* Fetched User Data Display */}
        {userData && (
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-bold text-gray-800 mb-2">✅ Restored User Data:</h3>
            <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
              {JSON.stringify(userData, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg text-sm">
          <h3 className="font-bold text-blue-800 mb-2">💡 What this tool does:</h3>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>Uses your existing token to fetch user data from the server</li>
            <li>Stores the user data back into localStorage</li>
            <li>Refreshes the page so components can access the restored data</li>
            <li>If this fails, you can clear everything and log in again</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ManualUserDataFixer;