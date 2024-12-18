import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import pool from '../config/database';

const router = Router();

// Get messages for a channel
router.get('/channels/:channelId/messages', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { channelId } = req.params;
  const userId = req.userId;
  const limit = 75;  
  const before = req.query.before; // Message ID to fetch messages before

  console.log('Fetching messages for channel:', channelId);
  console.log('User ID:', userId);

  try {
    // First verify user has access to this channel
    const memberCheck = await pool.query(
      `SELECT 1 FROM server_members sm
       JOIN channels c ON c.server_id = sm.server_id
       WHERE c.id = $1 AND sm.user_id = $2`,
      [channelId, userId]
    );

    console.log('Member check result:', memberCheck.rows);

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'No access to this channel' });
    }

    let query = `
      SELECT m.*, 
        json_build_object(
          'id', u.id,
          'username', u.username,
          'avatar_url', u.avatar_url
        ) as user
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.channel_id = $1
    `;

    const queryParams = [channelId];

    if (before) {
      query += ` AND m.created_at < (SELECT created_at FROM messages WHERE id = $2)`;
      queryParams.push(before as string);
    }

    query += ` ORDER BY m.created_at DESC LIMIT $${queryParams.length + 1}`;
    queryParams.push(limit.toString());  // Convert limit to string

    const messages = await pool.query(query, queryParams);
    
    res.json(messages.rows.reverse());
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/channels/:channelId/messages', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { channelId } = req.params;
  const { content } = req.body;
  const userId = req.userId;

  try {
    // Verify user has access to this channel
    const memberCheck = await pool.query(
      `SELECT 1 FROM server_members sm
       JOIN channels c ON c.server_id = sm.server_id
       WHERE c.id = $1 AND sm.user_id = $2`,
      [channelId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'No access to this channel' });
    }

    // Create message
    const result = await pool.query(
      `INSERT INTO messages (channel_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, content, user_id, channel_id, created_at, updated_at`,
      [channelId, userId, content]
    );

    // Fetch user data to include in response
    const userResult = await pool.query(
      `SELECT id, username, avatar_url FROM users WHERE id = $1`,
      [userId]
    );

    const message = {
      ...result.rows[0],
      user: userResult.rows[0]
    };

    res.status(201).json(message);
  } catch (error) {
    console.error('Failed to create message:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

export default router;