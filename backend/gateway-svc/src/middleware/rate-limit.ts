import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisClient } from '../config/redis';

export const createRateLimiters = () => {
    const generalLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutos
        limit: 100,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        store: new RedisStore({
            // @ts-ignore - Ignoramos conflicto de tipos estricto si aparece
            sendCommand: (...args: string[]) => redisClient.sendCommand(args),
            prefix: 'rl_general:'
        }),
        message: "Demasiadas peticiones (Global Limit). Intenta más tarde."
    });

    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutos
        limit: 5, // 5 intentos máximo
        skipSuccessfulRequests: true, // No contar requests exitosos
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        store: new RedisStore({
            // @ts-ignore
            sendCommand: (...args: string[]) => redisClient.sendCommand(args),
            prefix: 'rl_auth:'
        }),
        message: "Demasiados intentos de login. Bloqueado por 15 minutos."
    });

    return { generalLimiter, authLimiter };
};
