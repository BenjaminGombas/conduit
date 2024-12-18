import { io, Socket } from 'socket.io-client';
import { store } from '@/store/store';
import { addMessage, updateMessage } from '@/store/messages/messageSlice';
import { updateMultiplePresences, updateUserPresence, UserStatus } from '@/store/presence/presenceSlice';
import { updateMemberStatus } from '@/store/servers/serverMemberSlice';


class SocketService {
  private socket: Socket | null = null;
  
  connect(token: string) {
    this.socket = io('https://api.saltydevelopment.com', {
      auth: {
        token
      },
      withCredentials: true
    });

    this.setupListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('message:new', (message) => {
      store.dispatch(addMessage(message));
    });

    this.socket.on('message:update', (message) => {
      store.dispatch(updateMessage(message));
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('presence:initial', (presences) => {
      store.dispatch(updateMultiplePresences(presences));
    });

    this.socket.on('presence:update', (presence) => {
      console.log('Socket received presence update:', presence);
      if (presence.id && presence.status) {
        store.dispatch(updateUserPresence({
          id: presence.id,
          status: presence.status as UserStatus
        }));
      }
    });

    // Send initial presence when connected
    this.socket.on('connect', () => {
      const userId = store.getState().auth.user?.id;
      if (userId) {
          store.dispatch(updateUserPresence({
              id: userId,
              status: 'online'
          }));
      }
  });
  }

  

  sendMessage(channelId: string, content: string) {
    if (!this.socket) return;

    this.socket.emit('message:send', {
      channelId,
      content
    });
  }
}

export const socketService = new SocketService();