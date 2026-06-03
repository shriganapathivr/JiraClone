import { create } from 'zustand';
import api from '../lib/api.js';

export const useAuthStore = create((set) => ({
  user: null,
  loading: true, // true until the initial /me check resolves

  async init() {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.token) localStorage.setItem('zira_token', data.token);
    set({ user: data.user });
    return data.user;
  },

  async register(name, email, password) {
    const { data } = await api.post('/auth/register', { name, email, password });
    if (data.token) localStorage.setItem('zira_token', data.token);
    set({ user: data.user });
    return data.user;
  },

  // Update the current user's profile (username + avatar).
  async updateProfile(fields) {
    const { data } = await api.put('/auth/me', fields);
    set({ user: data.user });
    return data.user;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('zira_token');
      set({ user: null });
    }
  },
}));
