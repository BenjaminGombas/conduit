import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/services/api';
import {RootState} from "@/store/store.ts";

export interface Server {
  id: string;
  name: string;
  owner_id: string;
  icon_url?: string | null;
}

interface ServersState {
  servers: { [serverId: string]: Server };
  userServers: Server[];
  loading: boolean;
  error: string | null;
}

const initialState: ServersState = {
  servers: {},
  userServers: [],
  loading: false,
  error: null,
};

interface UpdateServerRequest {
    serverId: string;
    name: string;
    icon_url?: string | null;
}

export const fetchServer = createAsyncThunk(
  'servers/fetchServer',
  async (serverId: string) => {
    const response = await api.get<Server>(`/servers/${serverId}`);
    return response.data;
  }
);
export const updateServer = createAsyncThunk(
    'servers/updateServer',
    async (data: UpdateServerRequest) => {
        console.log('updateServer thunk received:', data);
        try {
            const response = await api.patch(`/servers/${data.serverId}`, {
                name: data.name,
                icon_url: data.icon_url
            });
            console.log('Server update response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error updating server:', error);
            throw error;
        }
    }
);

export const deleteServer = createAsyncThunk(
    'servers/deleteServer',
    async (serverId: string) => {
      await api.delete(`/servers/${serverId}`);
      return serverId;
    }
);

export const fetchUserServers = createAsyncThunk(
    'servers/fetchUserServers',
    async () => {
        const response = await api.get('/servers');
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
      })
      .addCase(deleteServer.fulfilled, (state, action) => {
        delete state.servers[action.payload];
      })
        .addCase(updateServer.fulfilled, (state, action) => {
            state.servers[action.payload.id] = action.payload;
            // Update the server in userServers array as well
            const index = state.userServers.findIndex(s => s.id === action.payload.id);
            if (index !== -1) {
                state.userServers[index] = action.payload;
            }
        })
        .addCase(fetchUserServers.fulfilled, (state, action) => {
            state.userServers = action.payload;
            // Also update the servers object
            action.payload.forEach(server => {
                state.servers[server.id] = server;
            });
        });

  },
});

export const selectUserServers = (state: RootState) => state.servers.userServers;

export default serversSlice.reducer;