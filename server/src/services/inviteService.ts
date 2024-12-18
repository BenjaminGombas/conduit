import { Pool } from 'pg';
import crypto from 'crypto';

export class InviteService {
    constructor(private pool: Pool) {}

    private generateInviteCode(): string {
        return crypto.randomBytes(5).toString('hex');
    }

    async createInvite(serverId: string, creatorId: string, options?: {
        maxUses?: number;
        expiresIn?: number; // Duration in seconds
    }) {
        const code = this.generateInviteCode();
        const expiresAt = options?.expiresIn 
            ? new Date(Date.now() + options.expiresIn * 1000)
            : null;

        const result = await this.pool.query(
            `INSERT INTO server_invites 
             (code, server_id, creator_id, max_uses, expires_at)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [code, serverId, creatorId, options?.maxUses || null, expiresAt]
        );

        return result.rows[0];
    }

    async getInvite(code: string) {
        const result = await this.pool.query(
            `SELECT i.*, s.name as server_name, s.icon_url as server_icon,
                    u.username as creator_name
             FROM server_invites i
             JOIN servers s ON s.id = i.server_id
             JOIN users u ON u.id = i.creator_id
             WHERE i.code = $1 AND (
                 i.expires_at IS NULL OR i.expires_at > NOW()
             ) AND (
                 i.max_uses IS NULL OR i.uses < i.max_uses
             ) AND NOT i.revoked`,
            [code]
        );

        return result.rows[0];
    }

    async useInvite(code: string, userId: string) {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');

            // Get and validate invite
            const invite = await this.getInvite(code);
            if (!invite) {
                throw new Error('Invalid or expired invite');
            }

            // Check if user is already a member
            const memberCheck = await client.query(
                'SELECT 1 FROM server_members WHERE server_id = $1 AND user_id = $2',
                [invite.server_id, userId]
            );

            if (memberCheck.rows.length > 0) {
                throw new Error('Already a member of this server');
            }

            // Increment uses
            await client.query(
                'UPDATE server_invites SET uses = uses + 1 WHERE code = $1',
                [code]
            );

            // Add user to server
            await client.query(
                'INSERT INTO server_members (server_id, user_id) VALUES ($1, $2)',
                [invite.server_id, userId]
            );

            await client.query('COMMIT');
            return invite;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async listServerInvites(serverId: string) {
        const result = await this.pool.query(
            `SELECT i.*, u.username as creator_name
             FROM server_invites i
             JOIN users u ON u.id = i.creator_id
             WHERE i.server_id = $1
             ORDER BY i.created_at DESC`,
            [serverId]
        );

        return result.rows;
    }

    async revokeInvite(code: string, serverId: string, userId: string) {
        const result = await this.pool.query(
            `UPDATE server_invites
             SET revoked = true
             WHERE code = $1 AND server_id = $2
             AND (creator_id = $3 OR EXISTS (
                 SELECT 1 FROM servers WHERE id = $2 AND owner_id = $3
             ))
             RETURNING *`,
            [code, serverId, userId]
        );

        return result.rows[0];
    }
}