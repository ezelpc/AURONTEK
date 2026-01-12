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
        'https://aurontek.vercel.app', // Fallback Vercel
        'https://aurontekhq-api.ddns.net', // Fallback No-IP
        'http://localhost:5173', // Desarrollo local
        'http://localhost:3000',
        'http://localhost:5000'
    ].filter(Boolean) as string[]; // Filtrar valores undefined y asegurar tipo string[]

    app.use(cors({
        origin: (origin, callback) => {
            // Log para debug
            console.log('[CORS DEBUG] Origin recibido:', origin);
            console.log('[CORS DEBUG] Allowed origins:', allowedOrigins);

            // Permitir requests sin origin en desarrollo
            if (!origin && process.env.NODE_ENV !== 'production') {
                return callback(null, true);
            }

            // En producción, permitir requests sin origin si vienen de un proxy confiable (Nginx)
            // Esto es seguro porque Nginx está en el mismo servidor y solo acepta conexiones HTTPS
            if (!origin && process.env.NODE_ENV === 'production') {
                console.log('[CORS] Request sin Origin en producción - probablemente de Nginx proxy');
                return callback(null, true);
            }

            // Verificar si el origin está en la lista de permitidos
            if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
                // CRITICAL FIX: Return the specific origin, not true
                // callback(null, true) causes cors to send '*'
                callback(null, origin);
            } else {
                console.warn(`[CORS] Origin no permitido: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'X-Service-Token', 'X-Service-Name']
    }));

    // Helmet - Security headers
    app.use(helmet());
    app.use(morgan('dev'));

    // Sanitization - Prevent NoSQL injection
    // TEMPORARILY DISABLED: express-mongo-sanitize has a bug with Node.js 18+
    // TypeError: Cannot set property query of #<IncomingMessage> which has only a getter
    // const { sanitizeMiddleware } = require('./middleware/sanitize');
    // app.use(sanitizeMiddleware);

    // CSRF Protection
    const { csrfCookieParser, csrfProtection, getCsrfToken, csrfErrorHandler } = require('./middleware/csrf');
    app.use(csrfCookieParser);

    // Endpoint para obtener CSRF token (sin protección)
    app.get('/api/csrf-token', getCsrfToken);

    // Logging Middleware
    app.use((req, res, next) => {
        console.log(`[GATEWAY DEBUG] ${req.method} ${req.url}`);
        console.log(`[GATEWAY DEBUG] Full path: ${req.path}`);
        console.log(`[GATEWAY DEBUG] Auth Header: ${req.headers.authorization ? 'PRESENT' : 'MISSING'}`);

        // Special logging for bulk upload
        if (req.url.includes('/bulk')) {
            console.log('🔥 [GATEWAY] BULK UPLOAD REQUEST DETECTED');
            console.log('🔥 [GATEWAY] Content-Type:', req.headers['content-type']);
            console.log('🔥 [GATEWAY] All Headers:', JSON.stringify(req.headers, null, 2));
        }

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
