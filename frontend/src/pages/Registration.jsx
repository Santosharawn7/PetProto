// src/RegistrationForm.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, fetchSignInMethodsForEmail } from 'firebase/auth';
import LogoOmniverse from '../assets/LogoOmniverse.png';

const API_URL = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || 'http://127.0.0.1:5000';

const RegistrationForm = () => {
  const navigate = useNavigate();
  const auth = getAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    preferredUsername: '',
    phone: '',
    email: '',
    sex: '',
    address: '',
    password: '',
    userType: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [message, setMessage] = useState('');
  const [userTypes, setUserTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userTypesLoading, setUserTypesLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) {
      navigate('/home');
    }
    
    // Fetch user types from backend
    fetchUserTypes();
  }, [navigate]);

  const fetchUserTypes = async () => {
    try {
      setUserTypesLoading(true);
      console.log('Fetching user types from:', `${API_URL}/user-types`);
      
      const response = await axios.get(`${API_URL}/user-types`);
      console.log('User types response:', response.data);
      
      if (Array.isArray(response.data)) {
        setUserTypes(response.data);
      } else {
        console.error('Expected array but got:', response.data);
        setMessage('Invalid user types format received from server.');
      }
    } catch (error) {
      console.error('Error fetching user types:', error);
      console.error('Error details:', error.response?.data || error.message);
      setMessage('Failed to load user types. Please refresh the page.');
      
      // Fallback to hardcoded user types if API fails
      const fallbackUserTypes = [
        { value: 'pet_parent', display: 'Pet Parent' },
        { value: 'pet_shop_owner', display: 'Pet Shop Owner' },
        { value: 'veterinarian', display: 'Veterinarian' },
        { value: 'pet_sitter', display: 'Pet Sitter' }
      ];
      setUserTypes(fallbackUserTypes);
    } finally {
      setUserTypesLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleConfirmChange = (e) => setConfirmPassword(e.target.value);

  const getVerificationUrl = () => {
    const { origin } = window.location;
    if (origin.startsWith('http://localhost')) {
      return `${origin}/login`;
    }
    return 'https://pet-proto.vercel.app/login';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!agreed) {
      setMessage("You must agree to the Terms & Conditions before signing up.");
      setLoading(false);
      return;
    }

    if (formData.password !== confirmPassword) {
      setMessage("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!formData.userType) {
      setMessage("Please select a user type");
      setLoading(false);
      return;
    }

    try {
      const methods = await fetchSignInMethodsForEmail(auth, formData.email);
      if (methods.includes('google.com')) {
        setMessage("This email is already registered via Google Sign-In. Please use the Google login option.");
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      const verificationUrl = getVerificationUrl();
      await sendEmailVerification(user, { url: verificationUrl });

      const backendData = { ...formData, uid: user.uid };
      await axios.post(`${API_URL}/register`, backendData);

      setMessage("Registration successful! Please check your email to verify.");
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      console.error('Registration error:', error);
      setMessage(error.response?.data?.error || error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl max-sm:max-w-lg mx-auto p-6 mt-6">
      <div className="mb-10 text-center">
        <a className="inline-block" href="#">
          <img className="h-50 w-50" src={LogoOmniverse} alt="Logo" />
        </a>
        <p className="text-lg text-coolGray-500 font-medium">
          Sign up into your account
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid sm:grid-cols-2 gap-8">
          <div>
            <label className="block mb-2 text-coolGray-800 font-medium">First Name</label>
            <input 
              name="firstName" 
              type="text" 
              placeholder="Enter first name" 
              value={formData.firstName} 
              onChange={handleChange} 
              className="appearance-none block w-full p-3 leading-5 text-coolGray-900 border border-coolGray-200 rounded-lg shadow-md placeholder-coolGray-400 focus:outline-none focus:ring-3 bg-white" 
              required 
            />
          </div>
          <div>
            <label className="block mb-2 text-coolGray-800 font-medium">Last Name</label>
            <input 
              name="lastName" 
              type="text" 
              placeholder="Enter last name" 
              value={formData.lastName} 
              onChange={handleChange} 
              className="appearance-none block w-full p-3 leading-5 text-coolGray-900 border border-coolGray-200 rounded-lg shadow-md placeholder-coolGray-400 focus:outline-none focus:ring-3 bg-white" 
              required 
            />
          </div>
          <div>
            <label className="block mb-2 text-coolGray-800 font-medium">Email Id</label>
            <input 
              name="email" 
              type="email" 
              placeholder="Enter email" 
              value={formData.email} 
              onChange={handleChange} 
              className="appearance-none block w-full p-3 leading-5 text-coolGray-900 border border-coolGray-200 rounded-lg shadow-md placeholder-coolGray-400 focus:outline-none focus:ring-3 bg-white" 
              required 
            />
          </div>
          <div>
            <label className="block mb-2 text-coolGray-800 font-medium">Mobile No.</label>
            <input 
              name="phone" 
              type="tel" 
              placeholder="Enter mobile number" 
              value={formData.phone} 
              onChange={handleChange} 
              className="appearance-none block w-full p-3 leading-5 text-coolGray-900 border border-coolGray-200 rounded-lg shadow-md placeholder-coolGray-400 focus:outline-none focus:ring-3 bg-white" 
              required 
            />
          </div>
          <div>
            <label className="block mb-2 text-coolGray-800 font-medium">Password</label>
            <input 
              name="password" 
              type="password" 
              placeholder="Enter password" 
              value={formData.password} 
              onChange={handleChange} 
              className="appearance-none block w-full p-3 leading-5 text-coolGray-900 border border-coolGray-200 rounded-lg shadow-md placeholder-coolGray-400 focus:outline-none focus:ring-3 bg-white" 
              required 
            />
          </div>
          <div>
            <label className="block mb-2 text-coolGray-800 font-medium">Confirm Password</label>
            <input 
              name="cpassword" 
              type="password" 
              placeholder="Enter confirm password" 
              value={confirmPassword} 
              onChange={handleConfirmChange} 
              className="appearance-none block w-full p-3 leading-5 text-coolGray-900 border border-coolGray-200 rounded-lg shadow-md placeholder-coolGray-400 focus:outline-none focus:ring-3 bg-white" 
              required 
            />
          </div>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 gap-8">
          <div>
            <label className="block mb-2 text-coolGray-800 font-medium">Preferred Username</label>
            <input 
              name="preferredUsername" 
              type="text" 
              placeholder="Enter your preferred username" 
              value={formData.preferredUsername} 
              onChange={handleChange} 
              className="appearance-none block w-full p-3 leading-5 text-coolGray-900 border border-coolGray-200 rounded-lg shadow-md placeholder-coolGray-400 focus:outline-none focus:ring-3 bg-white" 
              required 
            />
          </div>
          <div>
            <label className="block mb-2 text-coolGray-800 font-medium">Sex</label>
            <select 
              name="sex" 
              value={formData.sex} 
              onChange={handleChange} 
              className="appearance-none block w-full p-3 leading-5 text-coolGray-900 border border-coolGray-200 rounded-lg shadow-md placeholder-coolGray-400 focus:outline-none focus:ring-3 bg-white" 
              required
            >
              <option value="">Select Sex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 text-coolGray-800 font-medium">User Type</label>
            <select 
              name="userType" 
              value={formData.userType} 
              onChange={handleChange} 
              className="appearance-none block w-full p-3 leading-5 text-coolGray-900 border border-coolGray-200 rounded-lg shadow-md placeholder-coolGray-400 focus:outline-none focus:ring-3 bg-white" 
              required
              disabled={userTypesLoading}
            >
              <option value="">
                {userTypesLoading ? 'Loading user types...' : 'Select User Type'}
              </option>
              {userTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.display}
                </option>
              ))}
            </select>
            {userTypesLoading && (
              <p className="mt-1 text-sm text-coolGray-600">Loading user types...</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="block mb-2 text-coolGray-800 font-medium">Address</label>
            <input 
              name="address" 
              type="text" 
              placeholder="Enter your address" 
              value={formData.address} 
              onChange={handleChange} 
              className="appearance-none block w-full p-3 leading-5 text-coolGray-900 border border-coolGray-200 rounded-lg shadow-md placeholder-coolGray-400 focus:outline-none focus:ring-3 bg-white" 
              required 
            />
          </div>
          <div className="mb-3 flex items-start">
            <input 
              type="checkbox" 
              id="terms" 
              checked={agreed} 
              onChange={(e) => setAgreed(e.target.checked)} 
              className="mt-1 mr-2 w-5 h-5" 
              required 
            />
            <label htmlFor="terms" className="text-base text-coolGray-800">
              By signing up, I agree to the{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:text-blue-800 underline">
                Terms & Conditions
              </a>
            </label>
          </div>
        </div>

        <div className="mt-6">
          <button 
            type="submit" 
            disabled={loading}
            className="inline-block py-3 px-7 mb-4 w-full text-base text-green-50 font-medium text-center leading-6 bg-blue-600 hover:bg-blue-800 focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Sign up'}
          </button>
        </div>

        {message && (
          <div className="mt-4">
            <p className={`text-center font-bold ${message.includes('successful') ? 'text-green-600' : 'text-red-500'}`}>
              {message}
            </p>
          </div>
        )}

        <div className="mt-4 text-center">
          <p className="text-sm font-medium">
            Already have an account?{' '}
            <a href="/login" className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm;