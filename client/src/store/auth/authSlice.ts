import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User, AuthState } from '@/types/auth';
import { socketService } from '@/services/socket';
import { api } from '@/services/api';
import { setInitialPresence } from '../presence/presenceSlice';
import { store } from '../store';


let accessToken: string | null = null;

// Initial state type matches our AuthState interface
const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

interface LoginCredentials {
  email: string;
  password: string;
}

// Async thunk for login
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data;
      // Store access token in memory only
      accessToken = data.accessToken;

      // set initial presence when user logs in
      store.dispatch(setInitialPresence({ userId: response.data.user.id }));
      
      // Refresh token is handled by cookie automatically
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Network error occurred');
    }
  }
);

// Async thunk for registration
export const register = createAsyncThunk(
  'auth/register',
  async (
    { username, email, password }: { username: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post('/auth/register', { username, email, password });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

// Async thunk for getting current user
export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
        const response = await api.get('/auth/profile');
        return response.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to get user data');
    }
}
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.error = null;
      accessToken = null;
      socketService.disconnect();
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login cases
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.error = null;
        socketService.connect(accessToken!); // Use accessToken from memory
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Login failed';
      })

    // Register cases
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.error = null;
        socketService.connect(accessToken!);
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Registration failed';
      })

    // Get current user cases
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to get user data';
      });
  },
});

// Export actions and reducer
export const { logout, setError, clearError } = authSlice.actions;
export default authSlice.reducer;

// Selector functions
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectLoading = (state: { auth: AuthState }) => state.auth.loading;
export const selectError = (state: { auth: AuthState }) => state.auth.error;