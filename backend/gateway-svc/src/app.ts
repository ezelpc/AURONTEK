import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { createProxyRouter } from './routes/proxy';
import { redisClient } from './config/redis';

export const createApp = () => {
    const app = express();

    // CORS - Permitir frontend en puerto 5000 (Vite) y 3000 (legacy)
    app.use(cors({
        origin: ['http://localhost:5000', 'http://localhost:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));
    app.use(helmet());
    app.use(morgan('dev'));

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
