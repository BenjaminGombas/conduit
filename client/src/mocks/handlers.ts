import { http, HttpResponse } from 'msw'

const messages = [
  {
    id: '1',
    content: 'Hey everyone! Welcome to the test channel 👋',
    userId: 'user1',
    channelId: '@me',
    createdAt: new Date(Date.now() - 50000).toISOString(),
    updatedAt: new Date(Date.now() - 50000).toISOString(),
    user: {
      id: 'user1',
      username: 'TestUser1',
      avatarUrl: null
    }
  },
  {
    id: '2',
    content: 'Thanks! Excited to test this app 🚀',
    userId: 'user2',
    channelId: '@me',
    createdAt: new Date(Date.now() - 40000).toISOString(),
    updatedAt: new Date(Date.now() - 40000).toISOString(),
    user: {
      id: 'user2',
      username: 'TestUser2',
      avatarUrl: null
    }
  },
  {
    id: '3',
    content: 'This is a longer message to test how the UI handles multiple lines of text. It should wrap nicely and maintain readability while staying within the chat container bounds.',
    userId: 'user1',
    channelId: '@me',
    createdAt: new Date(Date.now() - 30000).toISOString(),
    updatedAt: new Date(Date.now() - 30000).toISOString(),
    user: {
      id: 'user1',
      username: 'TestUser1',
      avatarUrl: null
    }
  }
]

export const handlers = [
  // Mock login
  http.post('http://localhost:4000/api/auth/login', () => {
    return HttpResponse.json({
      token: 'fake-jwt-token',
      user: {
        id: 'user1',
        username: 'TestUser1',
        email: 'test@example.com',
        avatarUrl: null,
        status: 'online'
      }
    })
  }),

  // Mock messages fetch
  http.get('http://localhost:4000/api/channels/:channelId/messages', () => {
    return HttpResponse.json(messages)
  })
]