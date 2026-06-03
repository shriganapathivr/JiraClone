import axios from 'axios';

// Relative baseURL works in dev (Vite proxy) and prod (same origin).
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Attach token from localStorage as a fallback to the HTTP-only cookie.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('zira_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
