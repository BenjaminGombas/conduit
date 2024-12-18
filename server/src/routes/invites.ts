import { Router } from 'express';
import { InviteService } from '../services/inviteService';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import pool from '../config/database';

const router = Router();
const inviteService = new InviteService(pool);

// Create invite
router.post('/servers/:serverId/invites', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { serverId } = req.params;
        const { maxUses, expiresIn } = req.body;
        const userId = req.userId!;

        // Verify user has permission to create invites
        const memberCheck = await pool.query(
            'SELECT 1 FROM server_members WHERE server_id = $1 AND user_id = $2',
            [serverId, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ error: 'No permission to create invites' });
        }

        const invite = await inviteService.createInvite(serverId, userId, {
            maxUses,
            expiresIn
        });

        res.status(201).json(invite);
    } catch (error) {
        console.error('Failed to create invite:', error);
        res.status(500).json({ error: 'Failed to create invite' });
    }
});

// Get invite info
router.get('/invites/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const invite = await inviteService.getInvite(code);

        if (!invite) {
            return res.status(404).json({ error: 'Invalid or expired invite' });
        }

        res.json(invite);
    } catch (error) {
        console.error('Failed to get invite:', error);
        res.status(500).json({ error: 'Failed to get invite' });
    }
});

// Use invite
router.post('/invites/:code/join', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { code } = req.params;
        const userId = req.userId!;

        const invite = await inviteService.useInvite(code, userId);
        res.json(invite);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to join server';
        res.status(400).json({ error: message });
    }
});

// List server invites
router.get('/servers/:serverId/invites', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { serverId } = req.params;
        const userId = req.userId!;

        // Verify user has permission to view invites
        const memberCheck = await pool.query(
            'SELECT 1 FROM server_members WHERE server_id = $1 AND user_id = $2',
            [serverId, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ error: 'No permission to view invites' });
        }

        const invites = await inviteService.listServerInvites(serverId);
        res.json(invites);
    } catch (error) {
        console.error('Failed to list invites:', error);
        res.status(500).json({ error: 'Failed to list invites' });
    }
});

// Revoke invite
router.delete('/servers/:serverId/invites/:code', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { serverId, code } = req.params;
        const userId = req.userId!;

        const invite = await inviteService.revokeInvite(code, serverId, userId);
        if (!invite) {
            return res.status(404).json({ error: 'Invite not found or no permission to revoke' });
        }

        res.json(invite);
    } catch (error) {
        console.error('Failed to revoke invite:', error);
        res.status(500).json({ error: 'Failed to revoke invite' });
    }
});

export default router;