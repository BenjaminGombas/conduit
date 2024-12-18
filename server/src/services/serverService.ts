import { Pool } from 'pg';
import { Request, Response } from 'express';
import { redis } from '../config/redis';

// Extend Express Request to include userId from auth middleware
interface AuthRequest extends Request {
  userId?: string;
}

interface CreateServerData {
  name: string;
  ownerId: string;
  iconUrl?: string;
}

interface ServerMember {
  userId: string;
  serverId: string;
  nickname?: string;
  roles: string[];
}

// Initialize database pool
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB
});

export class ServerService {
  constructor(private pool: Pool) {}

  async createServer({ name, ownerId, iconUrl }: CreateServerData) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create the server
      const serverResult = await client.query(
        `INSERT INTO servers (name, owner_id, icon_url) 
         VALUES ($1, $2, $3) 
         RETURNING id, name, owner_id, icon_url, created_at`,
        [name, ownerId, iconUrl]
      );
      
      const server = serverResult.rows[0];
      
      // Add owner as member
      await client.query(
        `INSERT INTO server_members (user_id, server_id) 
         VALUES ($1, $2)`,
        [ownerId, server.id]
      );
      
      // Create default general channel
      const channelResult = await client.query(
        `INSERT INTO channels (server_id, name, type) 
         VALUES ($1, $2, $3)
         RETURNING id`,
        [server.id, 'general', 'text']
      );
      
      await client.query('COMMIT');
      
      return {
        ...server,
        defaultChannelId: channelResult.rows[0].id // Add this to the response
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getServer(serverId: string) {
    // Try cache first
    const cached = await redis.get(`server:${serverId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // If not in cache, get from database
    const result = await this.pool.query(
      `SELECT s.*, 
              array_agg(DISTINCT c.id) as channel_ids,
              count(DISTINCT sm.user_id) as member_count
       FROM servers s
       LEFT JOIN channels c ON c.server_id = s.id
       LEFT JOIN server_members sm ON sm.server_id = s.id
       WHERE s.id = $1
       GROUP BY s.id`,
      [serverId]
    );
    
    const server = result.rows[0];
    
    if (server) {
      // Cache the result
      await redis.set(`server:${serverId}`, JSON.stringify(server), {
        EX: 3600 // Cache for 1 hour
      });
    }
    
    return server;
  }

  async getServerMembers(serverId: string): Promise<ServerMember[]> {
    const result = await this.pool.query(
      `SELECT sm.user_id, sm.server_id, sm.nickname, sm.roles,
              u.username, u.avatar_url
       FROM server_members sm
       JOIN users u ON u.id = sm.user_id
       WHERE sm.server_id = $1`,
      [serverId]
    );
    
    return result.rows;
  }

  async getUserServers(userId: string) {
    const result = await this.pool.query(
      `SELECT s.* 
       FROM servers s
       JOIN server_members sm ON s.id = sm.server_id
       WHERE sm.user_id = $1
       ORDER BY s.created_at DESC`,
      [userId]
    );
    
    return result.rows;
  }

  async addMemberToServer(serverId: string, userId: string, roles: string[] = ['member']) {
    await this.pool.query(
      `INSERT INTO server_members (user_id, server_id, roles)
       VALUES ($1, $2, $3)`,
      [userId, serverId, roles]
    );
    
    // Invalidate cached member count
    await redis.del(`server:${serverId}`);
  }
}

// Express route handler
export const createServerHandler = async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  const ownerId = req.userId; // From auth middleware
  
  if (!ownerId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const serverService = new ServerService(pool);
    const server = await serverService.createServer({
      name,
      ownerId,
      iconUrl: req.body.iconUrl
    });
    
    res.status(201).json(server);
  } catch (error) {
    console.error('Failed to create server:', error);
    res.status(500).json({ error: 'Failed to create server' });
  }
};