import { api } from './api';

export const authService = {
  async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async register(username: string, email: string, password: string) {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async forgotPassword(email: string) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  
  async resetPassword(token: string, newPassword: string) {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  async verifyEmail(token: string, email: string) {
    const response = await api.post('/auth/verify-email', { token, email });
    return response.data;
},

  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      localStorage.clear();
      return;
    }

    try {
      const response = await api.post('/auth/logout', { refreshToken });
      localStorage.clear();
      return response.data;
    } catch (error) {
      localStorage.clear();
      throw error;
    }
  }
};