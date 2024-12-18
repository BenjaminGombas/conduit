import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../config/database';
import { redis } from '../config/redis';
import { sendEmailWithTemplate } from '../utils/email';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

interface UserRegistration {
    username: string;
    email: string;
    password: string;
}

interface TokenPayload {
    userId: string;
    email: string;
    type: 'access' | 'refresh';
}

interface ProfileUpdate {
    username?: string;
    email?: string;
    avatar_url?: string;
    current_password?: string;
    new_password?: string;
}

export const authService = {
    
    // email verification
    async verifyEmail(token: string, email: string) {
        // Log for debugging
        console.log('Verifying email with token:', token);
        console.log('Email:', email);

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        console.log('Hashed token for verification:', hashedToken);
    
        const storedEmail = await redis.get(`email_verify:${hashedToken}`);
        console.log('Stored email from Redis:', storedEmail);
        
        if (!storedEmail || storedEmail !== email) {
            throw new Error('Invalid or expired verification token');
        }
    
        // Update user's verified status in database
        await pool.query(
            'UPDATE users SET email_verified = true WHERE email = $1',
            [email]
        );
    
        // Delete the verification token
        await redis.del(`email_verify:${hashedToken}`);
    
        return { message: 'Email verified successfully' };
    },

    // send verification email
    async sendVerificationEmail(email: string) {
        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');

        // Log for debugging
        console.log('Generated token:', verificationToken);
        console.log('Hashed token:', hashedToken);

        await redis.set(`email_verify:${hashedToken}`, email, {
            EX: 86400 // 24 hours
        });

        const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}&email=${email}`;
        
        // Log for debugging
        console.log('Verification URL:', verificationUrl);

        await sendEmailWithTemplate(email, 'verifyEmail', {
            username: email.split('@')[0], // Basic username extraction
            actionUrl: verificationUrl
        });

        return { message: 'Verification email sent' };
    },

    // registration function
    async registerUser({ username, email, password }: UserRegistration) {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, hashedPassword]
        );
        
        // Send verification email immediately after registration
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');
    
        // Store token in Redis with 24 hour expiry
        await redis.set(`email_verify:${hashedToken}`, email, {
            EX: 86400 // 24 hours
        });
    
        const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}&email=${email}`;
    
        await sendEmailWithTemplate(email, 'verifyEmail', {
            username,
            actionUrl: verificationUrl
        });
    
        return result.rows[0];
    },

    
    async loginUser(email: string, password: string) {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        const user = result.rows[0];
        
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            throw new Error('Invalid credentials');
        }

        // Generate tokens
        const accessToken = jwt.sign(
            { userId: user.id, type: 'access' },
            JWT_SECRET,
            { expiresIn: ACCESS_TOKEN_EXPIRY }
        );

        // Add family ID for refresh token tracking
        const familyId = crypto.randomBytes(16).toString('hex');
        const refreshToken = jwt.sign(
            { userId: user.id, type: 'refresh', family: familyId },
            JWT_SECRET,
            { expiresIn: REFRESH_TOKEN_EXPIRY }
        );

        // Store refresh token family in Redis
        await redis.set(`token_family:${familyId}`, JSON.stringify({
            userId: user.id,
            valid: true
        }), {
            EX: 7 * 24 * 60 * 60 // 7 days
        });

        return { user, accessToken, refreshToken };
    },

    // refresh token function
    async refreshAccessToken(oldRefreshToken: string) {
        try {
            const decoded = jwt.verify(oldRefreshToken, JWT_SECRET) as { 
                userId: string;
                type: string;
                family: string;
            };
            
            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type');
            }

            // Check if refresh token family is valid
            const family = await redis.get(`token_family:${decoded.family}`);
            if (!family || !JSON.parse(family).valid) {
                throw new Error('Invalid refresh token');
            }

            // Invalidate old token family
            await redis.del(`token_family:${decoded.family}`);

            // Create new tokens
            const accessToken = jwt.sign(
                { userId: decoded.userId, type: 'access' },
                JWT_SECRET,
                { expiresIn: ACCESS_TOKEN_EXPIRY }
            );

            // Create new refresh token family
            const newFamilyId = crypto.randomBytes(16).toString('hex');
            const refreshToken = jwt.sign(
                { userId: decoded.userId, type: 'refresh', family: newFamilyId },
                JWT_SECRET,
                { expiresIn: REFRESH_TOKEN_EXPIRY }
            );

            // Store new refresh token family
            await redis.set(`token_family:${newFamilyId}`, JSON.stringify({
                userId: decoded.userId,
                valid: true
            }), {
                EX: 7 * 24 * 60 * 60
            });

            return { accessToken, refreshToken };
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    },

    // profile update function
    async updateProfile(userId: string, updates: ProfileUpdate) {
        const fields: string[] = [];
        const values: any[] = [];
        let counter = 1;

        Object.entries(updates).forEach(([key, value]) => {
            if (value && key !== 'current_password' && key !== 'new_password') {
                fields.push(`${key} = $${counter}`);
                values.push(value);
                counter++;
            }
        });

        if (updates.current_password && updates.new_password) {
            const user = await pool.query(
                'SELECT password_hash FROM users WHERE id = $1',
                [userId]
            );

            const isValidPassword = await bcrypt.compare(
                updates.current_password,
                user.rows[0].password_hash
            );

            if (!isValidPassword) {
                throw new Error('Current password is incorrect');
            }

            const hashedPassword = await bcrypt.hash(
                updates.new_password,
                SALT_ROUNDS
            );
            fields.push(`password_hash = $${counter}`);
            values.push(hashedPassword);
        }

        if (fields.length === 0) {
            throw new Error('No valid fields to update');
        }

        const result = await pool.query(
            `UPDATE users 
             SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $${counter} 
             RETURNING id, username, email, avatar_url, status, created_at, updated_at`,
            [...values, userId]
        );

        return result.rows[0];
    },

    // password reset request function
    async initiatePasswordReset(email: string) {
        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
    
        // Store token in Redis with 1 hour expiry
        await redis.set(`pwd_reset:${hashedToken}`, email, {
            EX: 3600 // 1 hour
        });
    
        // Create reset URL
        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
        // Send the password reset email
        await sendEmailWithTemplate(email, 'passwordReset', {
            username: email.split('@')[0],
            actionUrl: resetUrl
        });
    
        return { 
            message: 'If an account exists, a password reset email will be sent'
        };
    },

    // notify user of a new login
    async notifyNewLogin(email: string, userId: string) {
        const securityUrl = `${process.env.CLIENT_URL}/settings/security`;
    
        await sendEmailWithTemplate(email, 'newLogin', {
            username: email.split('@')[0],
            actionUrl: securityUrl
        });
    },

    // password reset function
    async resetPassword(resetToken: string, newPassword: string) {
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        const email = await redis.get(`pwd_reset:${hashedToken}`);
        if (!email) {
            throw new Error('Invalid or expired reset token');
        }

        const hashedPassword = await bcrypt.hash(
            newPassword,
            SALT_ROUNDS
        );

        await pool.query(
            'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
            [hashedPassword, email]
        );

        await redis.del(`pwd_reset:${hashedToken}`);

        return { message: 'Password successfully reset' };
    },

    // token revocation function
    async revokeToken(refreshToken: string) {
        try {
            const decoded = jwt.verify(refreshToken, JWT_SECRET) as TokenPayload;
            const exp = (decoded as any).exp - Math.floor(Date.now() / 1000);
            
            await redis.set(`blacklist:${refreshToken}`, '1', {
                EX: Math.max(exp, 0)
            });

            return { message: 'Token revoked successfully' };
        } catch (error) {
            throw new Error('Invalid token');
        }
    },

    async logout(refreshToken: string) {
        try {
            const decoded = jwt.verify(refreshToken, JWT_SECRET) as { family: string };
            await redis.del(`token_family:${decoded.family}`);
        } catch (error) {
            // Token might be invalid, but still want to clear client state
            console.error('Error during logout:', error);
        }
    }
};