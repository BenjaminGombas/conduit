import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline';

interface UserPresence {
  id: string;
  status: UserStatus;
  customStatus?: string;
}

interface PresenceState {
  users: Record<string, UserPresence>;
  loading: boolean;
  error: string | null;
}

const initialState: PresenceState = {
  users: {},
  loading: false,
  error: null
};

const presenceSlice = createSlice({
  name: 'presence',
  initialState,
  reducers: {
    updateUserPresence: (state, action: PayloadAction<UserPresence>) => {
      state.users[action.payload.id] = action.payload;
    },
    updateMultiplePresences: (state, action: PayloadAction<UserPresence[]>) => {
      action.payload.forEach(presence => {
          state.users[presence.id] = presence;
      });
  } ,
    setInitialPresence: (state, action: PayloadAction<{ userId: string }>) => {
      state.users[action.payload.userId] = {
        id: action.payload.userId,
        status: 'online'
      };
    }
  }
});

export const { updateUserPresence, updateMultiplePresences, setInitialPresence } = presenceSlice.actions;
export default presenceSlice.reducer;