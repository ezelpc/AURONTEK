import { createClient } from "redis";
import dotenv from "dotenv";
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const pubClient = createClient({ url: REDIS_URL });
export const subClient = pubClient.duplicate();

export const connectRedis = async () => {
    try {
        await Promise.all([pubClient.connect(), subClient.connect()]);
        console.log('✅ [Chat-SVC] Conectado a Redis (Pub/Sub)');
    } catch (error) {
        console.error('❌ [Chat-SVC] Error conectando a Redis:', error);
    }
};

pubClient.on('error', (err) => console.error('Redis Pub Client Error', err));
subClient.on('error', (err) => console.error('Redis Sub Client Error', err));
