# Conduit Chat Platform

A modern, real-time chat platform inspired by Discord, built with React, Node.js, and PostgreSQL. Conduit provides seamless communication and community building features with a clean, modern interface.

![Conduit Logo](/client/conduit-high-resolution-logo-transparent.svg)

## Features

### Core Functionality
- Real-time messaging with WebSocket support
- Server (community) creation and management
- Channel-based communication
- User presence system (online, idle, DnD, offline)
- Direct messaging between users
- Friend system with status indicators
- User profiles with customizable avatars

### Security & Authentication
- JWT-based authentication
- Email verification
- Password reset functionality
- Secure session management
- Rate limiting and CSRF protection

### Technical Features
- Real-time message delivery
- Message history and scrollback
- Server member management
- Role-based access control
- Server invitation system
- Responsive design for all devices

## Tech Stack

### Frontend
- React with TypeScript
- Redux Toolkit for state management
- Socket.IO client for real-time features
- Tailwind CSS with shadcn/ui components
- React Router for navigation
- Framer Motion for animations

### Backend
- Node.js with Express
- PostgreSQL for primary database
- Redis for caching and real-time features
- Socket.IO for WebSocket connections
- JWT for authentication
- TypeScript for type safety

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by Discord's user interface and functionality
- Thanks to the open-source community for the amazing tools and libraries
- Icons provided by Lucide Icons
- UI components from shadcn/ui
