import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = createClient({
    url: redisUrl
});

// Connect to Redis and handle events
redis.on('error', (error) => {
    console.error('Redis Client Error:', error);
});

redis.on('connect', () => {
    console.log('Connected to Redis');
});

// Connect to Redis
redis.connect().catch(console.error);

export default redis;