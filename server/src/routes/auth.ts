import { Router, Request } from 'express';
import { authService } from '../services/auth';
import { validateRequest } from '../middleware/validate';
import { authenticateToken } from '../middleware/auth';
import { body } from 'express-validator';


interface AuthenticatedRequest extends Request {
    userId?: string;
}

const router = Router();

// register route
router.post(
    '/register',
    [
        body('username')
            .trim()
            .isLength({ min: 3, max: 32 })
            .withMessage('Username must be between 3 and 32 characters'),
        body('email')
            .isEmail()
            .withMessage('Must be a valid email address'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters'),
        validateRequest
    ],
    async (req, res) => {
        try {
            const { username, email, password } = req.body;
            const user = await authService.registerUser({ username, email, password });
            
            res.status(201).json({
                user,
                message: 'Registration successful. Please check your email for verification.'
            });
        } catch (error) {
            res.status(500).json({ error: 'Registration failed' });
        }
    }
);

// login route
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Must be a valid email address'),
        body('password').notEmpty().withMessage('Password is required'),
        validateRequest
    ],
    async (req, res) => {
        try {
            const { user, accessToken, refreshToken } = await authService.loginUser(
                req.body.email,
                req.body.password
            );
    
            // Set refresh token as httpOnly cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
    
            // Only send access token in response
            res.json({ user, accessToken });
        } catch (error) {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    }
);

// profile update route
router.patch(
    '/profile',
    authenticateToken,
    [
        body('username').optional().trim().isLength({ min: 3, max: 32 }),
        body('email').optional().isEmail(),
        body('avatar_url').optional().isURL(),
        body('current_password').optional().notEmpty(),
        body('new_password').optional().isLength({ min: 8 }),
        validateRequest
    ],
    async (req, res) => {
        try {
            const updatedUser = await authService.updateProfile(req.userId!, {
                username: req.body.username,
                email: req.body.email,
                avatar_url: req.body.avatar_url,
                current_password: req.body.current_password,
                new_password: req.body.new_password
            });
            res.json(updatedUser);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Profile update failed';
            res.status(400).json({ error: message });
        }
    }
);

  router.post('/refresh-token', async (req, res) => {
    try {
      // Get token from cookie instead of request body
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ error: 'No refresh token' });
      }
  
      const { accessToken, refreshToken: newRefreshToken } = await authService.refreshAccessToken(refreshToken);
  
      // Set new refresh token cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
  
      res.json({ accessToken });
    } catch (error) {
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  });

router.post(
    '/forgot-password',
    [
        body('email').isEmail().withMessage('Must be a valid email address'),
        validateRequest
    ],
    async (req, res) => {
        try {
            const { email } = req.body;
            
            if (!email) {
                return res.status(400).json({
                    error: 'Email is required'
                });
            }
    
            await authService.initiatePasswordReset(email);
            
            // Don't reveal if email exists for security
            res.json({ 
                message: 'If an account exists, a password reset email will be sent' 
            });
        } catch (error) {
            console.error('Password reset request failed:', error);
            res.status(500).json({ 
                error: 'Failed to process password reset request' 
            });
        }
    }
);

router.post(
    '/reset-password',
    [
        body('token').notEmpty().withMessage('Reset token is required'),
        body('newPassword')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters'),
        validateRequest
    ],
    async (req, res) => {
        try {
            const { token, newPassword } = req.body;
            
            if (!token || !newPassword) {
                return res.status(400).json({
                    error: 'Token and new password are required'
                });
            }
    
            await authService.resetPassword(token, newPassword);
            res.json({ message: 'Password successfully reset' });
        } catch (error) {
            res.status(400).json({ 
                error: error instanceof Error ? error.message : 'Password reset failed' 
            });
        }
    }
);

router.post(
    '/send-verification',
    authenticateToken,
    [
        body('email').isEmail().withMessage('Must be a valid email address'),
        validateRequest
    ],
    async (req, res) => {
        try {
            const { email } = req.body;
            const result = await authService.sendVerificationEmail(email);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Failed to send verification email' });
        }
    }
);

router.post(
    '/verify-email',
    [
        body('email').isEmail().withMessage('Must be a valid email address'),
        body('token').notEmpty().withMessage('Verification token is required'),
        validateRequest
    ],
    async (req, res) => {
        try {
            const { token, email } = req.body;
            
            if (!token || !email) {
                return res.status(400).json({
                    error: 'Token and email are required'
                });
            }
    
            await authService.verifyEmail(token, email);
            res.json({ message: 'Email successfully verified' });
        } catch (error) {
            res.status(400).json({ 
                error: error instanceof Error ? error.message : 'Email verification failed' 
            });
        }
    }
);

router.post(
    '/logout',
    [
        body('refreshToken').notEmpty().withMessage('Refresh token is required'),
        validateRequest
    ],
    async (req, res) => {
        try {
            const { refreshToken } = req.body;
            await authService.revokeToken(refreshToken);
            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            res.status(400).json({ error: 'Logout failed' });
        }
    }
);

export default router;