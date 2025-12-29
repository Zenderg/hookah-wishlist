import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

console.log('[API] Initializing axios instance', {
  API_URL,
  env: import.meta.env.MODE,
});

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] Request interceptor - Adding token to request', {
        url: config.url,
        method: config.method,
        hasToken: true,
      });
    } else {
      console.log('[API] Request interceptor - No token available', {
        url: config.url,
        method: config.method,
        hasToken: false,
      });
    }
    return config;
  },
  (error) => {
    console.error('[API] Request interceptor error', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 errors
api.interceptors.response.use(
  (response) => {
    console.log('[API] Response interceptor - Success', {
      url: response.config.url,
      status: response.status,
      statusText: response.statusText,
    });
    return response;
  },
  (error) => {
    console.error('[API] Response interceptor - Error', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data,
    });

    if (error.response?.status === 401) {
      console.warn('[API] 401 Unauthorized - Removing token and reloading');
      localStorage.removeItem('token');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;
