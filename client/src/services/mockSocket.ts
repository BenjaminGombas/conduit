import { store } from '@/store/store';
import { addMessage } from '@/store/messages/messageSlice';
import { updateUserPresence, updateMultiplePresences } from '@/store/presence/presenceSlice';
import type { Message } from '@/store/messages/messageSlice';
import type { UserStatus } from '@/store/presence/presenceSlice';

const mockUsers = [
    { id: 'user1', username: 'TestUser1', status: 'online' as UserStatus },
    { id: 'user2', username: 'TestUser2', status: 'idle' as UserStatus },
    { id: 'user3', username: 'TestUser3', status: 'dnd' as UserStatus },
    { id: 'user4', username: 'TestUser4', status: 'offline' as UserStatus },
  ];
let messageId = 4; 

class MockSocketService {
  connect(token: string) {
    console.log('Mock socket connected with token:', token);

    // Simulate initial presence data
    store.dispatch(updateMultiplePresences(
        mockUsers.map(user => ({
          id: user.id,
          status: user.status,
          lastSeen: new Date().toISOString()
        }))
      ));
  
      // Simulate random presence updates
      setInterval(() => {
        const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
        const statuses: UserStatus[] = ['online', 'idle', 'dnd', 'offline'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        store.dispatch(updateUserPresence({
          id: randomUser.id,
          status: randomStatus,
          lastSeen: new Date().toISOString()
        }));
      }, 10000); // Update random user status every 10 seconds
  }

  disconnect() {
    console.log('Mock socket disconnected');
  }

  sendMessage(channelId: string, content: string) {
    // Create a mock message
    const mockMessage: Message = {
      id: String(messageId++),
      content,
      userId: 'user1',
      channelId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: 'user1',
        username: 'TestUser1',
        avatarUrl: ''
      }
    };

    // Simulate network delay
    setTimeout(() => {
      store.dispatch(addMessage(mockMessage));
    }, 100);
  }
  updateStatus(status: UserStatus, customStatus?: string) {
    store.dispatch(updateUserPresence({
      id: 'user1', // Current user
      status,
      customStatus,
      lastSeen: new Date().toISOString()
    }));
}
}

export const mockSocketService = new MockSocketService();
