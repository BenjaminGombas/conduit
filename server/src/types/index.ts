export interface User {
    id: string;
    username: string;
    email: string;
    avatar_url?: string;
    status: 'online' | 'offline' | 'away';
    created_at: Date;
    updated_at: Date;
}

export interface ServerError extends Error {
    status?: number;
}