import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface UserRegistration {
    username: string;
    email: string;
    password: string;
}

export const authService = {
    async registerUser({ username, email, password }: UserRegistration) {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, hashedPassword]
        );
        
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

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return { user, token };
    }
};