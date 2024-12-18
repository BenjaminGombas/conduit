import { RootState } from '@/store/store';

export const selectChannelMessages = (channelId: string) => 
  (state: RootState) => state.messages.messages[channelId] || [];

export const selectMessagesLoading = (state: RootState) => state.messages.loading;
export const selectMessagesError = (state: RootState) => state.messages.error;