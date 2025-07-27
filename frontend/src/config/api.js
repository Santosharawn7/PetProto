// src/utils/api.js
import axios from 'axios';
import { getAuthToken } from '../utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    products: '/api/products',
    product: (id) => `/api/products/${id}`,
    categories: '/api/categories',
    cart: (sessionId) => `/api/cart/${sessionId}`,
    addToCart: '/api/cart',
    updateCartItem: (itemId) => `/api/cart/${itemId}`,
    removeCartItem: (itemId) => `/api/cart/${itemId}`,
    orders: '/api/orders'
  }
};

// Helper function to build full URL
export const buildApiUrl = (endpoint) => {
  return `${apiConfig.baseURL}${endpoint}`;
};

// Generic authorized request helper
export const authorizedRequest = (method, endpoint, data = null, extraConfig = {}) => {
  const token = getAuthToken();
  const config = {
    method,
    url: buildApiUrl(endpoint),
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraConfig.headers
    },
    ...extraConfig
  };
  if (data) config.data = data;
  return axios(config);
};
