// src/RegistrationForm.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';


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

    // try {
    //   // Post registration data to your backend endpoint
    //   const response = await axios.post('http://127.0.0.1:5000/register', formData);
    //   setMessage(response.data.message);

    //   // After successful registration, redirect user to the login page
    //   navigate('/login');
    // } catch (error) {
    //   setMessage(error.response?.data?.error || 'Registration failed');
    // }

    try {
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
      <div className="text-center mb-12 sm:mb-16">
        <a href="javascript:void(0)">
          <img src="https://readymadeui.com/readymadeui.svg" alt="logo" className="w-44 inline-block" />
        </a>
        <h4 className="text-slate-600 text-base mt-6">Sign up into your account</h4>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid sm:grid-cols-2 gap-8">
          {/* First Name */}
          <div>
            <label className="text-slate-800 text-sm font-medium mb-2 block">First Name</label>
            <input
              name="firstName"
              type="text"
              placeholder="Enter first name"
              value={formData.firstName}
              onChange={handleChange}
              className="bg-slate-100 w-full text-slate-800 text-sm px-4 py-3 rounded 
                         focus:bg-white outline-blue-500 transition-all"
              required
            />
          </div>
          {/* Last Name */}
          <div>
            <label className="text-slate-800 text-sm font-medium mb-2 block">Last Name</label>
            <input
              name="lastName"
              type="text"
              placeholder="Enter last name"
              value={formData.lastName}
              onChange={handleChange}
              className="bg-slate-100 w-full text-slate-800 text-sm px-4 py-3 rounded 
                         focus:bg-white outline-blue-500 transition-all"
              required
            />
          </div>
          {/* Email ID */}
          <div>
            <label className="text-slate-800 text-sm font-medium mb-2 block">Email Id</label>
            <input
              name="email"
              type="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={handleChange}
              className="bg-slate-100 w-full text-slate-800 text-sm px-4 py-3 rounded 
                         focus:bg-white outline-blue-500 transition-all"
              required
            />
          </div>
          {/* Mobile No. */}
          <div>
            <label className="text-slate-800 text-sm font-medium mb-2 block">Mobile No.</label>
            <input
              name="phone"
              type="tel"
              placeholder="Enter mobile number"
              value={formData.phone}
              onChange={handleChange}
              className="bg-slate-100 w-full text-slate-800 text-sm px-4 py-3 rounded 
                         focus:bg-white outline-blue-500 transition-all"
              required
            />
          </div>
          {/* Password */}
          <div>
            <label className="text-slate-800 text-sm font-medium mb-2 block">Password</label>
            <input
              name="password"
              type="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              className="bg-slate-100 w-full text-slate-800 text-sm px-4 py-3 rounded 
                         focus:bg-white outline-blue-500 transition-all"
              required
            />
          </div>
          {/* Confirm Password */}
          <div>
            <label className="text-slate-800 text-sm font-medium mb-2 block">Confirm Password</label>
            <input
              name="cpassword"
              type="password"
              placeholder="Enter confirm password"
              value={confirmPassword}
              onChange={handleConfirmChange}
              className="bg-slate-100 w-full text-slate-800 text-sm px-4 py-3 rounded 
                         focus:bg-white outline-blue-500 transition-all"
              required
            />
          </div>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 gap-8">
          {/* Preferred Username */}
          <div>
            <label className="text-slate-800 text-sm font-medium mb-2 block">Preferred Username</label>
            <input
              name="preferredUsername"
              type="text"
              placeholder="Enter your preferred username"
              value={formData.preferredUsername}
              onChange={handleChange}
              className="bg-slate-100 w-full text-slate-800 text-sm px-4 py-3 rounded 
                         focus:bg-white outline-blue-500 transition-all"
              required
            />
          </div>
          {/* Sex */}
          <div>
            <label className="text-slate-800 text-sm font-medium mb-2 block">Sex</label>
            <select
              name="sex"
              value={formData.sex}
              onChange={handleChange}
              className="bg-slate-100 w-full text-slate-800 text-sm px-4 py-3 rounded 
                         focus:bg-white outline-blue-500 transition-all"
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
            <label className="text-slate-800 text-sm font-medium mb-2 block">Address</label>
            <input
              name="address"
              type="text"
              placeholder="Enter your address"
              value={formData.address}
              onChange={handleChange}
              className="bg-slate-100 w-full text-slate-800 text-sm px-4 py-3 rounded 
                         focus:bg-white outline-blue-500 transition-all"
              required
            />
          </div>
        </div>

        <div className="mt-12">
          <button
            type="submit"
            className="mx-auto block py-3 px-6 text-sm font-medium tracking-wider rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
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
          <p className="text-slate-600 text-sm">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm;
