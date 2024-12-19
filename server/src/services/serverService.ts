import pool from '../config/database';
import { redis } from '../config/redis';
import { Request, Response } from 'express';

interface AuthRequest extends Request {
  userId?: string;
}

interface CreateServerData {
  name: string;
  ownerId: string;
  iconUrl?: string;
}

interface ServerUpdate {
  name?: string;
  icon_url?: string | null;
}

interface ServerMember {
  userId: string;
  serverId: string;
  nickname?: string;
  roles: string[];
}

export class ServerService {
  async createServer({ name, ownerId, iconUrl }: CreateServerData) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const serverResult = await client.query(
          `INSERT INTO servers (name, owner_id, icon_url) 
                 VALUES ($1, $2, $3) 
                 RETURNING id, name, owner_id, icon_url, created_at`,
          [name, ownerId, iconUrl]
      );

      const server = serverResult.rows[0];

      await client.query(
          `INSERT INTO server_members (user_id, server_id, roles) 
                 VALUES ($1, $2, $3)`,
          [ownerId, server.id, ['admin']]
      );

      const channelResult = await client.query(
          `INSERT INTO channels (server_id, name, type) 
                 VALUES ($1, $2, $3)
                 RETURNING id`,
          [server.id, 'general', 'text']
      );

      await client.query('COMMIT');

      return {
        ...server,
        defaultChannelId: channelResult.rows[0].id
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getServer(serverId: string) {
    const cached = await redis.get(`server:${serverId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const result = await pool.query(
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
      await redis.set(`server:${serverId}`, JSON.stringify(server), {
        EX: 3600 // Cache for 1 hour
      });
    }

    return server;
  }

  async getServerMembers(serverId: string): Promise<ServerMember[]> {
    const result = await pool.query(
        `SELECT u.id as user_id, 
                    u.username, 
                    u.avatar_url, 
                    u.status,
                    sm.nickname,
                    sm.roles
             FROM server_members sm
             JOIN users u ON u.id = sm.user_id
             WHERE sm.server_id = $1
             ORDER BY u.username ASC`,
        [serverId]
    );

    return result.rows;
  }

  async getUserServers(userId: string) {
    const result = await pool.query(
        `SELECT s.*, sm.roles 
             FROM servers s
             JOIN server_members sm ON s.id = sm.server_id
             WHERE sm.user_id = $1
             ORDER BY s.created_at DESC`,
        [userId]
    );

    return result.rows;
  }

  async updateServer(serverId: string, userId: string, updates: ServerUpdate) {
    console.log('Received update data:', updates);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const serverCheck = await client.query(
          `SELECT s.owner_id, sm.roles
             FROM servers s
             LEFT JOIN server_members sm ON sm.server_id = s.id AND sm.user_id = $2
             WHERE s.id = $1`,
          [serverId, userId]
      );

      const userRoles = serverCheck.rows[0]?.roles || [];
      if (serverCheck.rows[0]?.owner_id !== userId && !userRoles.includes('admin')) {
        throw new Error('No permission to update server');
      }

      // Build update query with all fields
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      if (typeof updates.name !== 'undefined') {
        updateFields.push(`name = $${paramCount}`);
        values.push(updates.name);
        paramCount++;
      }

      // Always include icon_url in the update, even if it's null
      updateFields.push(`icon_url = $${paramCount}`);
      values.push(updates.icon_url);
      paramCount++;

      // Add serverId as the last parameter
      values.push(serverId);

      console.log('Update Query Fields:', updateFields);
      console.log('Update Values:', values);

      const updateQuery = `
            UPDATE servers 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

      console.log('Final Update Query:', updateQuery);
      const result = await client.query(updateQuery, values);
      await client.query('COMMIT');

      console.log('Updated server result:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Server update error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteServer(serverId: string, userId: string) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const serverCheck = await pool.query(
          'SELECT owner_id FROM servers WHERE id = $1',
          [serverId]
      );

      if (serverCheck.rows[0]?.owner_id !== userId) {
        throw new Error('Only server owner can delete server');
      }

      await client.query('DELETE FROM servers WHERE id = $1', [serverId]);
      await redis.del(`server:${serverId}`);

      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async kickMember(serverId: string, adminId: string, memberId: string) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const adminCheck = await pool.query(
          `SELECT sm.roles, s.owner_id 
                 FROM server_members sm
                 JOIN servers s ON s.id = sm.server_id
                 WHERE s.id = $1 AND sm.user_id = $2`,
          [serverId, adminId]
      );

      if (adminCheck.rows[0]?.owner_id !== adminId &&
          !adminCheck.rows[0]?.roles.includes('admin')) {
        throw new Error('No permission to kick members');
      }

      if (adminCheck.rows[0].owner_id === memberId) {
        throw new Error('Cannot kick server owner');
      }

      await client.query(
          'DELETE FROM server_members WHERE server_id = $1 AND user_id = $2',
          [serverId, memberId]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getServerChannels(serverId: string) {
    const result = await pool.query(
        `SELECT id, name, server_id as "serverId", type 
             FROM channels 
             WHERE server_id = $1 
             ORDER BY name ASC`,
        [serverId]
    );

    return result.rows;
  }
}

export const createServerHandler = async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  const ownerId = req.userId;

  if (!ownerId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const serverService = new ServerService();
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