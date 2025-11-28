import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { createProxyRouter } from './routes/proxy';
import { redisClient } from './config/redis';

export const createApp = () => {
    const app = express();

    // Configuración de Seguridad y Logs
    app.set('trust proxy', 1);
    app.use(cors());
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
