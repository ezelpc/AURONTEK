import { createClient } from "redis";
import dotenv from "dotenv";
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisPubClient = createClient({ url: REDIS_URL });

export const connectRedis = async () => {
    try {
        await redisPubClient.connect();
        console.log('✅ [Notificaciones-SVC] Conectado a Redis (Publisher)');
    } catch (error) {
        console.error('❌ [Notificaciones-SVC] Error conectando a Redis:', error);
    }
};

redisPubClient.on('error', (err) => console.error('Redis Client Error', err));
