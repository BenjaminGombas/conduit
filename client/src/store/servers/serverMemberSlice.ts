import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/services/api';
import { UserStatus } from '../presence/presenceSlice';

interface ServerMember {
  user_id: string;
  username: string;
  nickname?: string;
  avatar_url?: string;
  status: UserStatus;

}

interface ServerMembersState {
  members: {
    [serverId: string]: ServerMember[];
  };
  loading: boolean;
  error: string | null;
}

const initialState: ServerMembersState = {
  members: {},
  loading: false,
  error: null
};

export const fetchServerMembers = createAsyncThunk(
  'serverMembers/fetchMembers',
  async (serverId: string) => {
    const response = await api.get(`/servers/${serverId}/members`);
    return { serverId, members: response.data };
  }
);
export const kickMember = createAsyncThunk(
    'serverMembers/kickMember',
    async ({ serverId, memberId }: { serverId: string; memberId: string }) => {
      await api.delete(`/servers/${serverId}/members/${memberId}`);
      return { serverId, memberId };
    }
);

const serverMembersSlice = createSlice({
  name: 'serverMembers',
  initialState,
  reducers: {
    updateMemberStatus: (state, action) => {
      const { userId, status } = action.payload;
      // Update status for this member across all servers they're in
      Object.keys(state.members).forEach(serverId => {
        const memberIndex = state.members[serverId].findIndex(
          member => member.user_id === userId
        );
        if (memberIndex !== -1) {
          state.members[serverId][memberIndex].status = status;
        }
      });
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServerMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServerMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.members[action.payload.serverId] = action.payload.members;
      })
      .addCase(fetchServerMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch server members';
      })
        .addCase(kickMember.fulfilled, (state, action) => {
          const { serverId, memberId } = action.payload;
          if (state.members[serverId]) {
            state.members[serverId] = state.members[serverId].filter(
                member => member.user_id !== memberId
            );
          }
        });

  }
});

export const { updateMemberStatus } = serverMembersSlice.actions;
export default serverMembersSlice.reducer;