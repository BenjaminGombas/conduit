import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { api, messageApi } from '@/services/api';

export interface Message {
  id: string;
  content: string;
  user_id: string;  
  channel_id: string;  
  created_at: string;  
  updated_at: string;  
  user: {
    id: string;
    username: string;
    avatar_url?: string;  
  };
}

interface MessagesState {
  messages: { [channelId: string]: Message[] };
  loading: boolean;
  error: string | null;
}

const initialState: MessagesState = {
  messages: {},
  loading: false,
  error: null,
};

export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async ({ channelId, before }: { channelId: string; before?: string }) => {
    const response = await api.get(
      `/channels/${channelId}/messages${before ? `?before=${before}` : ''}`
    );
    return {
      channelId,
      messages: response.data,
      isLoadingMore: !!before
    };
  }
);

export const createMessage = createAsyncThunk(
  'messages/createMessage',
  async ({ channelId, content }: { channelId: string; content: string }) => {
    const response = await messageApi.create(channelId, content);
    return response;
  }
);

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      const channelId = action.payload.channel_id;
      if (!state.messages[channelId]) {
        state.messages[channelId] = [];
      }
      state.messages[channelId].push(action.payload);
    },
    updateMessage: (state, action: PayloadAction<Message>) => {
      const channelId = action.payload.channel_id;
      const messageIndex = state.messages[channelId]?.findIndex(
        msg => msg.id === action.payload.id
      );
      if (messageIndex !== undefined && messageIndex !== -1) {
        state.messages[channelId][messageIndex] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state, action) => {
        // Only show loading for initial fetch, not when loading more
        if (!action.meta.arg.before) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { channelId, messages, isLoadingMore } = action.payload;
        state.loading = false;

        if (isLoadingMore) {
          // Merge older messages with existing ones
          const existingMessages = state.messages[channelId] || [];
          const newMessages = messages.filter(
            newMsg => !existingMessages.some(existingMsg => existingMsg.id === newMsg.id)
          );
          state.messages[channelId] = [...newMessages, ...existingMessages];
        } else {
          // Initial load - replace existing messages
          state.messages[channelId] = messages;
        }
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch messages';
      })
      .addCase(createMessage.fulfilled, (state, action) => {
        const channelId = action.payload.channel_id;
        if (!state.messages[channelId]) {
          state.messages[channelId] = [];
        }
        state.messages[channelId].push(action.payload);
      });
  },
});

export const { addMessage, updateMessage } = messagesSlice.actions;
export default messagesSlice.reducer;