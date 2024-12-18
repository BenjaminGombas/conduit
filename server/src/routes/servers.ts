import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import pool from '../config/database';
import { createServerHandler, ServerService } from '../services/serverService';

const router = Router();

// Create server endpoint
router.post('/', authenticateToken, createServerHandler);

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const serverService = new ServerService(pool);
      const userId = req.userId!;
      const servers = await serverService.getUserServers(userId);
      res.json(servers);
    } catch (error) {
      console.error('Failed to fetch servers:', error);
      res.status(500).json({ error: 'Failed to fetch servers' });
    }
});

router.get('/:serverId/channels', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { serverId } = req.params;
  const userId = req.userId;

  try {
    // Verify user has access to this server
    const memberCheck = await pool.query(
      `SELECT 1 FROM server_members 
       WHERE server_id = $1 AND user_id = $2`,
      [serverId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'No access to this server' });
    }

    // Fetch channels
    const channels = await pool.query(
      `SELECT id, name, server_id as "serverId", type 
       FROM channels 
       WHERE server_id = $1 
       ORDER BY name ASC`,
      [serverId]
    );

    res.json(channels.rows);
  } catch (error) {
    console.error('Failed to fetch channels:', error);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});


router.get('/:serverId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { serverId } = req.params;
  const userId = req.userId;

  try {
    // First verify user has access to this server
    const memberCheck = await pool.query(
      `SELECT 1 FROM server_members 
       WHERE server_id = $1 AND user_id = $2`,
      [serverId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'No access to this server' });
    }

    // Fetch server details
    const serverResult = await pool.query(
      `SELECT id, name, owner_id, icon_url
       FROM servers
       WHERE id = $1`,
      [serverId]
    );

    if (serverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Server not found' });
    }

    res.json(serverResult.rows[0]);
  } catch (error) {
    console.error('Failed to fetch server:', error);
    res.status(500).json({ error: 'Failed to fetch server' });
  }
});

router.get('/:serverId/members', authenticateToken, async (req, res) => {
  const { serverId } = req.params;
  const userId = req.userId;

  try {
    // Verify user has access to this server
    // TODO: refactor this check since it gets used so often
    const memberCheck = await pool.query(
      `SELECT 1 FROM server_members 
       WHERE server_id = $1 AND user_id = $2`,
      [serverId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'No access to this server' });
    }

    // Updated query to include status
    const members = await pool.query(
      `SELECT 
        u.id as user_id, 
        u.username, 
        u.avatar_url, 
        u.status,
        sm.nickname
       FROM server_members sm
       JOIN users u ON u.id = sm.user_id
       WHERE sm.server_id = $1
       ORDER BY u.username`,
      [serverId]
    );

    res.json(members.rows);
  } catch (error) {
    console.error('Failed to fetch server members:', error);
    res.status(500).json({ error: 'Failed to fetch server members' });
  }
});

export default router;