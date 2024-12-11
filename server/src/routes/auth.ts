import { Router } from 'express';
import { authService } from '../services/auth';

const router = Router();

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ 
                error: 'Username, email, and password are required' 
            });
        }

        const user = await authService.registerUser({ username, email, password });
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required' 
            });
        }

        const { user, token } = await authService.loginUser(email, password);
        res.json({ user, token });
    } catch (error) {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

export default router;