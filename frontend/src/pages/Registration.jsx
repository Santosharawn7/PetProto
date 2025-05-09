// src/RegistrationForm.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, fetchSignInMethodsForEmail } from 'firebase/auth';


const RegistrationForm = () => {

  const navigate = useNavigate();
  const auth = getAuth();

  // Form state for all fields required by your backend
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    preferredUsername: '',
    phone: '',
    email: '',
    sex: '',
    address: '',
    password: '',
  });

  // Separate state for password confirmation
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  // If the user is already logged in (session exists), redirect to home
  useEffect(() => {
    const token = localStorage.getItem('userToken'); // You're reading from the browser's localStorage to check if the user has previously logged in.
    if (token) {
      navigate('/home');
    }
  }, [navigate]);

  // Update formData for normal inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Update state for confirm password field
  const handleConfirmChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  // Handle form submission by posting registration data to the backend
  const handleSubmit = async (e) => {
    e.preventDefault(); // prevents the browser from reloading the page when the form is submitted — which is default behavior for HTML forms. 

    // Check that password and confirmation match
    if (formData.password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    try {

      // Check if this email is already registered via Google
      const methods = await fetchSignInMethodsForEmail(auth, formData.email);
      if (methods.includes('google.com')) {
        setMessage("This email is already registered via Google Sign-In. Please use the Google login option.");
        return;
      }

      // Register user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password); // userCredential contains info about the newly created user  
      const user = userCredential.user; // actual Firebase user object

      // Send email verification
      await sendEmailVerification(user, { // The email uses the default Firebase template.
        url: 'http://localhost:5173/login',  
      });

      // Save user info in Firestore via backend
      const backendData = { ...formData, uid: user.uid };
      await axios.post('http://127.0.0.1:5000/register', backendData);

      setMessage("Registration successful! Please check your email to verify.");
      setTimeout(() => navigate('/login'), 3000); // After 3 seconds, it redirects the user to the login page
      
    } catch (error) {
      setMessage(error.message || 'Registration failed');
    }

  };

  return (
    <div className="max-w-4xl max-sm:max-w-lg mx-auto p-6 mt-6">
      {/* <div className="text-center mb-12 sm:mb-16">
        <a href="javascript:void(0)">
          <img src="https://readymadeui.com/readymadeui.svg" alt="logo" className="w-44 inline-block" />
        </a>
        <h4 className="text-slate-600 text-base mt-6">Sign up into your account</h4>
      </div> */}
      <div className="mb-6 text-center">
        <a className="inline-block mb-6" href="#">
          <img className="h-20 w-50" src="https://web.petbridge.org/wp-content/uploads/2022/03/PetBridge-Meta-Image.png" alt="Logo" />
        </a>
        <p className="text-lg text-coolGray-500 font-medium">
          Sign up into your account
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid sm:grid-cols-2 gap-8">
          {/* First Name */}
          <div>
            <label className="block mb-2 text-coolGray-800 font-medium">First Name</label>
            <input
              name="firstName"
              type="text"
              placeholder="Enter first name"
              value={formData.firstName}
              onChange={handleChange}
              className="appearance-none block w-full p-3 leading-5 text-coolGray-900 border border-coolGray-200 rounded-lg shadow-md placeholder-coolGray-400 focus:outline-none focus:ring-2 focus:bg-white"
              required
            />
          </div>
          {/* Last Name */}
          <div>
            <label className="block mb-2 text-coolGray-800 font-medium">Last Name</label>
            <input
              name="lastName"
              type="text"
              placeholder="Enter last name"
              value={formData.lastName}
              onChange={handleChange}
              className="appearance-none block w-full p-3 leading-5 text-coolGray-900 border border-coolGray-200 rounded-lg shadow-md placeholder-coolGray-400 focus:outline-none focus:ring-2 focus:bg-white"
              required
            />
          </div>
          {/* Email ID */}
          <div>
            <label className="block mb-2 text-coolGray-800 font-medium">Email Id</label>
            <input
              name="email"
              type="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={handleChange}
              className="appearance-none block w-full p-3 leading-5 text-coolGray-900 border border-coolGray-200 rounded-lg shadow-md placeholder-coolGray-400 focus:outline-none focus:ring-2 focus:bg-white"
              required
            />
          </div>
          {/* Mobile No. */}
          <div>
            <label className="block mb-2 text-coolGray-800 font-medium">Mobile No.</label>
            <input
              name="phone"
              type="tel"
              placeholder="Enter mobile number"
              value={formData.phone}
              onChange={handleChange}
              className="appearance-none block w-full p-3 leading-5 text-coolGray-900 border border-coolGray-200 rounded-lg shadow-md placeholder-coolGray-400 focus:outline-none focus:ring-2 focus:bg-white"
              required
            />
          </div>
          {/* Password */}
          <div>
            <label className="block mb-2 text-coolGray-800 font-medium">Password</label>
            <input
              name="password"
              type="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              className="appearance-none block w-full p-3 leading-5 text-coolGray-900 border border-coolGray-200 rounded-lg shadow-md placeholder-coolGray-400 focus:outline-none focus:ring-2 focus:bg-white"
              required
            />
          </div>
          {/* Confirm Password */}
          <div>
            <label className="block mb-2 text-coolGray-800 font-medium">Confirm Password</label>
            <input
              name="cpassword"
              type="password"
              placeholder="Enter confirm password"
              value={confirmPassword}
              onChange={handleConfirmChange}
              className="appearance-none block w-full p-3 leading-5 text-coolGray-900 border border-coolGray-200 rounded-lg shadow-md placeholder-coolGray-400 focus:outline-none focus:ring-2 focus:bg-white"
              required
            />
          </div>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 gap-8">
          {/* Preferred Username */}
          <div>
            <label className="block mb-2 text-coolGray-800 font-medium">Preferred Username</label>
            <input
              name="preferredUsername"
              type="text"
              placeholder="Enter your preferred username"
              value={formData.preferredUsername}
              onChange={handleChange}
              className="appearance-none block w-full p-3 leading-5 text-coolGray-900 border border-coolGray-200 rounded-lg shadow-md placeholder-coolGray-400 focus:outline-none focus:ring-2 focus:bg-white"
              required
            />
          </div>
          {/* Sex */}
          <div>
            <label className="block mb-2 text-coolGray-800 font-medium">Sex</label>
            <select
              name="sex"
              value={formData.sex}
              onChange={handleChange}
              className="appearance-none block w-full p-3 leading-5 text-coolGray-900 border border-coolGray-200 rounded-lg shadow-md placeholder-coolGray-400 focus:outline-none focus:ring-2 focus:bg-white"
              required
            >
              <option value="">Select Sex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          {/* Address */}
          <div className="sm:col-span-2">
            <label className="block mb-2 text-coolGray-800 font-medium">Address</label>
            <input
              name="address"
              type="text"
              placeholder="Enter your address"
              value={formData.address}
              onChange={handleChange}
              className="appearance-none block w-full p-3 leading-5 text-coolGray-900 border border-coolGray-200 rounded-lg shadow-md placeholder-coolGray-400 focus:outline-none focus:ring-2 focus:bg-white"
              required
            />
          </div>
        </div>

        <div className="mt-8">
          <button
            type="submit"
            className="inline-block py-3 px-7 mb-4 w-full text-base text-green-50 font-medium text-center leading-6 bg-blue-600 hover:bg-blue-800 focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 rounded-md shadow-sm"
          >
            Sign up
          </button>
        </div>

        {message && (
          <div className="mt-4">
            <p className="text-center text-red-500 font-bold">{message}</p>
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
