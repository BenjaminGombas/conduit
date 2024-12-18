import { logout } from '@/store/auth/authSlice';
import { store } from '@/store/store';

import axios from 'axios';

const API_URL = 'https://api.saltydevelopment.com/api';

let accessToken: string | null = null;


export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // No need to pass refreshToken - it's in the cookie
        const response = await api.post('/auth/refresh-token');
        accessToken = response.data.accessToken;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Server-related API calls
interface CreateServerRequest {
  name: string;
  iconUrl?: string;
}

interface Server {
  id: string;
  name: string;
  owner_id: string;
  icon_url?: string;
  created_at: string;
}

export const serverApi = {
  create: async (data: CreateServerRequest): Promise<Server> => {
    const response = await api.post<Server>('/servers', data);
    return response.data;
  },

  getServer: async (serverId: string): Promise<Server> => {
    const response = await api.get<Server>(`/servers/${serverId}`);
    return response.data;
  },

  getServers: async (): Promise<Server[]> => {
    const response = await api.get<Server[]>('/servers');
    return response.data;
  }
};

export const messageApi = {
  create: async (channelId: string, content: string) => {
    const response = await api.post(`/channels/${channelId}/messages`, { content });
    return response.data;
  }
};