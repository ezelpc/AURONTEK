import { createClient } from "redis";
import dotenv from "dotenv";
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisPubClient = createClient({ url: REDIS_URL });
export const redisSubClient = redisPubClient.duplicate();

export const connectRedis = async () => {
    try {
        // Set connection timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
        );

        await Promise.race([
            Promise.all([
                redisPubClient.connect(),
                redisSubClient.connect()
            ]),
            timeoutPromise
        ]);

        console.log('✅ [Notificaciones-SVC] Conectado a Redis (Pub/Sub)');
    } catch (error) {
        console.warn('⚠️ [Notificaciones-SVC] No se pudo conectar a Redis:', error);
        console.warn('⚠️ Continuando sin Redis. Las notificaciones en tiempo real no estarán disponibles.');
        // No lanzar error, permitir que el servicio continúe
    }
};

redisPubClient.on('error', (err) => console.error('Redis Pub Client Error', err));
redisSubClient.on('error', (err) => console.error('Redis Sub Client Error', err));
