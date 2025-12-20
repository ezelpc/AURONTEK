import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { createProxyRouter } from './routes/proxy';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { redisClient } from './config/redis';

export const createApp = () => {
    const app = express();

    // CORS - Configuración para permitir Vercel y dominio personalizado
    const allowedOrigins = [
        process.env.FRONTEND_URL, // URL de Vercel
        process.env.CUSTOM_DOMAIN, // Dominio No-IP con HTTPS
        'http://localhost:5173', // Desarrollo local
        'http://localhost:3000'
    ].filter(Boolean) as string[]; // Filtrar valores undefined y asegurar tipo string[]

    app.use(cors({
        origin: (origin, callback) => {
            // Permitir requests sin origin SOLO en desarrollo (como Postman, curl)
            if (!origin && process.env.NODE_ENV !== 'production') {
                return callback(null, true);
            }

            // En producción, rechazar requests sin origin
            if (!origin) {
                return callback(new Error('Origin not allowed by CORS'));
            }

            // Verificar si el origin está en la lista de permitidos
            if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
                callback(null, true);
            } else {
                console.warn(`[CORS] Origin no permitido: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'X-Service-Token', 'X-Service-Name']
    }));

    // Helmet - Security headers (CORS disabled, we handle it above)
    app.use(helmet({
        crossOriginResourcePolicy: false // Disable CORS in helmet, we handle it separately
    }));
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

    // WebSocket Proxy for Socket.IO (chat-svc)
    const CHAT_SVC_URL = process.env.CHAT_SERVICE_URL || 'http://localhost:3003';
    app.use('/socket.io', createProxyMiddleware({
        target: CHAT_SVC_URL,
        changeOrigin: true,
        ws: true, // Enable WebSocket proxying
        logLevel: 'debug',
        pathRewrite: (path: string, req: any) => {
            // Re-add /socket.io prefix to ensure backend receives exact path
            return '/socket.io' + path;
        },
        onProxyReqWs: (proxyReq: any, req: any, socket: any) => {
            console.log('[GATEWAY WS] WebSocket proxying to chat-svc:', req.url);
        },
        onError: (err: any, req: any, res: any) => {
            console.error('[GATEWAY WS ERROR]', err.message);
        }
    } as any));

    return app;
};
