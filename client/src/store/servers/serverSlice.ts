import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/services/api';

export interface Server {
  id: string;
  name: string;
  owner_id: string;
  icon_url?: string | null;
}

interface ServersState {
  servers: { [serverId: string]: Server };
  loading: boolean;
  error: string | null;
}

const initialState: ServersState = {
  servers: {},
  loading: false,
  error: null,
};

export const fetchServer = createAsyncThunk(
  'servers/fetchServer',
  async (serverId: string) => {
    const response = await api.get<Server>(`/servers/${serverId}`);
    return response.data;
  }
);

const serversSlice = createSlice({
  name: 'servers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchServer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServer.fulfilled, (state, action) => {
        state.loading = false;
        state.servers[action.payload.id] = action.payload;
      })
      .addCase(fetchServer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch server';
      });
  },
});

export default serversSlice.reducer;