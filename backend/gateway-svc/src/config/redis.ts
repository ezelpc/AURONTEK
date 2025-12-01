import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

export const redisClient = createClient({
  url: REDIS_URL,
  socket: {
    reconnectStrategy: (retries: number) => Math.min(retries * 50, 1000)
  }
});

redisClient.on('error', (err: any) => console.log('❌ Redis Client Error', err));
redisClient.on('connect', () => console.log('✅ Conectado a Redis'));

export const connectRedis = async () => {
  await redisClient.connect().catch(console.error);
}; 