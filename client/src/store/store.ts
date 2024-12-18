import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth/authSlice';
import messagesReducer from './messages/messageSlice';
import channelsReducer from './channels/channelSlice';
import presenceReducer from './presence/presenceSlice';
import serversReducer from './servers/serverSlice';
import serverMembersReducer from './servers/serverMemberSlice';
import invitesReducer from './invites/inviteSlice';


export const store = configureStore({
  reducer: {
    auth: authReducer,
    messages: messagesReducer,
    presence: presenceReducer,
    channels: channelsReducer,
    servers: serversReducer,
    serverMembers: serverMembersReducer,
    invites: invitesReducer,

  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
import { useDispatch } from 'react-redux';
export const useAppDispatch = () => useDispatch<AppDispatch>();