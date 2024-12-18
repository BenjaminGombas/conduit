import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/services/api';

export interface Channel {
  id: string;
  name: string;
  serverId: string;
  type: string;
}

interface ChannelsState {
  channels: { [serverId: string]: Channel[] };
  loading: boolean;
  error: string | null;
}

const initialState: ChannelsState = {
  channels: {},
  loading: false,
  error: null,
};

export const fetchServerChannels = createAsyncThunk(
  'channels/fetchServerChannels',
  async (serverId: string) => {
    const response = await api.get(`/servers/${serverId}/channels`);
    return response.data;
  }
);

const channelsSlice = createSlice({
  name: 'channels',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchServerChannels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServerChannels.fulfilled, (state, action) => {
        state.loading = false;
        state.channels[action.meta.arg] = action.payload;
      })
      .addCase(fetchServerChannels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch channels';
      });
  },
});

export default channelsSlice.reducer;