import axios from 'axios';

const DEFAULT_API_URL = 'https://apiwadps.vercel.app/api';

const normalizeApiUrl = (value) => {
  const candidate = value?.trim();
  if (!candidate) return DEFAULT_API_URL;

  // Vite environment values are strings. Accept a hostname-only value and
  // repair the common `https:example.com` typo before handing it to Axios.
  const withProtocol = /^https?:\/\//i.test(candidate)
    ? candidate
    : /^https?:/i.test(candidate)
      ? candidate.replace(/^(https?):\/?/i, '$1://')
      : `https://${candidate}`;

  try {
    const url = new URL(withProtocol);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported protocol');
    return url.toString().replace(/\/$/, '');
  } catch {
    console.warn('Invalid VITE_API_URL; using the production API endpoint instead.');
    return DEFAULT_API_URL;
  }
};

export const apiBaseUrl = normalizeApiUrl(import.meta.env.VITE_API_URL);
export const apiOrigin = new URL(apiBaseUrl).origin;

const api = axios.create({
  baseURL: apiBaseUrl,
});

// Interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to redirect on 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if we aren't already on login or register pages
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
