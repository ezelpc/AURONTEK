import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { createProxyRouter } from './routes/proxy';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { redisClient } from './config/redis';

export const createApp = () => {
    const app = express();

    // CORS - Permitir frontend en puerto 5000 (Vite) y 3000 (legacy)
    // CORS - Permitir frontend en puerto 5000 (Vite) y 3000 (legacy) y 5173 (Vite default)
    app.use(cors({
        origin: ['http://localhost:5000', 'http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
    }));
    app.use(helmet());
    app.use(morgan('dev'));

    // Logging Middleware
    app.use((req, res, next) => {
        console.log(`[GATEWAY DEBUG] ${req.method} ${req.url}`);
        console.log(`[GATEWAY DEBUG] Full path: ${req.path}`);
        console.log(`[GATEWAY DEBUG] Auth Header: ${req.headers.authorization ? 'PRESENT' : 'MISSING'}`);
        next();
    });

    // Inicializar Rutas SIN rate limiter (desarrollo)
    const proxyRoutes = createProxyRouter(null);
    app.use('/api', proxyRoutes);

    // Health Check
    app.get('/health', (req: Request, res: Response) => {
        res.json({
            status: 'OK',
            gateway: 'Running',
            redis: redisClient.isOpen ? 'Connected' : 'Disconnected'
        });
    });

    return app;
};
