import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/error';
import { initializeEmailService } from './utils/email';
import pool from './config/database';
import authRoutes from './routes/auth';
import serverRoutes from './routes/servers';
import messageRoutes from './routes/messages';
import inviteRoutes from './routes/invites';
import uploadRoutes from './routes/upload';
import path from "path";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        credentials: true,
        methods: ["GET", "POST", "PATCH"]
    }
});

// Socket authentication middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        socket.data.userId = decoded.userId;
        next();
    } catch (error) {
        next(new Error('Invalid token'));
    }
});

// Express middleware
app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api', messageRoutes);
app.use('/api', inviteRoutes)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
app.use('/api/upload', uploadRoutes)

// Health check route
app.get('/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ 
            status: 'ok', 
            timestamp: result.rows[0].now,
            message: 'Database connection successful'
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            message: 'Database connection failed'
        });
    }
});

app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', async (socket) => {
    const userId = socket.data.userId;
    console.log('User connected:', socket.id);
    try {
        // Update user's status in database immediately on connection
        await pool.query(
            'UPDATE users SET status = $1 WHERE id = $2',
            ['online', userId]
        );

        // Fetch all online users for initial state
        const onlineUsers = await pool.query(
            'SELECT id, status FROM users WHERE status != $1',
            ['offline']
        );

        // Send current online users to the newly connected client
        socket.emit('presence:update', {
            id: userId,
            status: 'online'
        });

        // Broadcast to other clients that this user is online
        socket.broadcast.emit('presence:update', {
            id: userId,
            status: 'online'
        });

        socket.on('disconnect', async () => {
            console.log('User disconnected:', userId);
            
            // Update user's status in database
            await pool.query(
                'UPDATE users SET status = $1 WHERE id = $2',
                ['offline', userId]
            );

            // Broadcast user's offline status
            io.emit('presence:update', {
                id: userId,
                status: 'offline'
            });
        });

    } catch (error) {
        console.error('Error handling presence:', error);
    }

    // Handle new messages
    socket.on('message:send', async (data: { channelId: string, content: string }) => {
        console.log('Message send attempt:', {
            channelId: data.channelId,
            userId: socket.data.userId,
            content: data.content
        });
    
        try {
            // Check if user has access to channel
            const memberCheckQuery = `
                SELECT 1 FROM server_members sm
                JOIN channels c ON c.server_id = sm.server_id
                WHERE c.id = $1 AND sm.user_id = $2`;
            
            console.log('Running access check with:', {
                channelId: data.channelId,
                userId: socket.data.userId,
                query: memberCheckQuery
            });
    
            const memberCheck = await pool.query(memberCheckQuery,
                [data.channelId, socket.data.userId]
            );
    
            console.log('Member check result:', memberCheck.rows);
    
            if (memberCheck.rows.length === 0) {
                console.log('Access denied - no matching records found');
                socket.emit('error', 'No access to this channel');
                return;
            }

            // Create message
            const result = await pool.query(
                `INSERT INTO messages (channel_id, user_id, content)
                 VALUES ($1, $2, $3)
                 RETURNING id, content, user_id, channel_id, created_at, updated_at`, 
                [data.channelId, socket.data.userId, data.content]
            );

            // Fetch user data
            const userResult = await pool.query(
                `SELECT id, username, avatar_url  
                 FROM users WHERE id = $1`,
                [socket.data.userId]
            );

            const message = {
                ...result.rows[0],
                user: userResult.rows[0]
            };

            // Broadcast to everyone
            io.emit('message:new', message);
            
        } catch (error) {
            console.error('Failed to create message:', error);
            socket.emit('error', 'Failed to create message');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
});

const port = process.env.PORT || 4000;

const startServer = async () => {
    try {
        await initializeEmailService();
        
        httpServer.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();