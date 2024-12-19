import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { ServerService } from '../services/serverService';

const router = Router();
const serverService = new ServerService();

// Create server
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    const ownerId = req.userId;

    if (!ownerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

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
});

// Get user's servers
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const servers = await serverService.getUserServers(req.userId!);
    res.json(servers);
  } catch (error) {
    console.error('Failed to fetch servers:', error);
    res.status(500).json({ error: 'Failed to fetch servers' });
  }
});

// Get specific server
router.get('/:serverId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { serverId } = req.params;
    const server = await serverService.getServer(serverId);

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    res.json(server);
  } catch (error) {
    console.error('Failed to fetch server:', error);
    res.status(500).json({ error: 'Failed to fetch server' });
  }
});

// Update server
router.patch('/:serverId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { serverId } = req.params;
    const { name, icon_url } = req.body;
    console.log('Received update request:', { serverId, name, icon_url });
    const server = await serverService.updateServer(serverId, req.userId!, {
      name,
      icon_url
    });

    res.json(server);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update server';
    res.status(400).json({ error: message });
  }
});

// Delete server
router.delete('/:serverId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { serverId } = req.params;
    await serverService.deleteServer(serverId, req.userId!);
    res.json({ message: 'Server deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete server';
    res.status(400).json({ error: message });
  }
});

// Get server channels
router.get('/:serverId/channels', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { serverId } = req.params;
    const channels = await serverService.getServerChannels(serverId);
    res.json(channels);
  } catch (error) {
    console.error('Failed to fetch channels:', error);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// Get server members
router.get('/:serverId/members', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { serverId } = req.params;
    const members = await serverService.getServerMembers(serverId);
    res.json(members);
  } catch (error) {
    console.error('Failed to fetch server members:', error);
    res.status(500).json({ error: 'Failed to fetch server members' });
  }
});

// Kick member
router.delete('/:serverId/members/:memberId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { serverId, memberId } = req.params;
    await serverService.kickMember(serverId, req.userId!, memberId);
    res.json({ message: 'Member kicked successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to kick member';
    res.status(400).json({ error: message });
  }
});

export default router;