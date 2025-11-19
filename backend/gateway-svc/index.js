import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix para __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno ANTES de cualquier otra importación
dotenv.config({
    path: path.resolve(__dirname, '../.env')
});

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import routes from './routes/gateway.routes.js';
import { authMiddleware, publicRoutes } from './middleware/auth.middleware.js';
import { healthCheck } from './controllers/health.controller.js';
import { logger, winstonStream } from './middleware/logger.middleware.js';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// MIDDLEWARES BÁSICOS
// ========================================
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ 
    origin: process.env.FRONTEND_ORIGIN || '*',
    credentials: true 
}));
app.use(morgan('combined', { stream: winstonStream }));

// ========================================
// RATE LIMITERS
// ========================================
const authLimiter = rateLimit({ 
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos
    message: 'Demasiados intentos de login, intente más tarde.'
});

const apiLimiter = rateLimit({ 
    windowMs: 15 * 60 * 1000, 
    max: 100 
});

// Aplicar rate limiter específico para auth
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/admin-sistema/login', authLimiter);

// Rate limiter general para todas las rutas API
app.use('/api/', apiLimiter);

// ========================================
// HEALTH CHECK (ANTES DE AUTH)
// ========================================
app.get('/health', healthCheck);
app.get('/api/v1/health', healthCheck);

// ========================================
// LOGGING DE REQUESTS
// ========================================
app.use((req, res, next) => {
    logger.info(`📨 ${req.method} ${req.path} - Origin: ${req.get('origin') || 'N/A'}`);
    next();
});

// ========================================
// AUTH MIDDLEWARE - Saltar rutas públicas
// ========================================
app.use((req, res, next) => {
    // Verificar si la ruta es pública
    const isPublicRoute = publicRoutes.some(route => {
        if (route.includes('*')) {
            const baseRoute = route.replace('/*', '');
            return req.path.startsWith(baseRoute);
        }
        return req.path === route;
    });

    if (isPublicRoute) {
        logger.info(`✅ Ruta pública permitida: ${req.path}`);
        return next();
    }
    
    logger.info(`🔒 Verificando autenticación para: ${req.path}`);
    return authMiddleware(req, res, next);
});

// ========================================
// PROXY ROUTES
// ========================================
Object.entries(routes).forEach(([mountPath, opts]) => {
    const proxyConfig = {
        target: opts.target,
        changeOrigin: true,
        pathRewrite: opts.pathRewrite || undefined,
        proxyTimeout: opts.timeout || 5000,
        timeout: opts.timeout || 5000,
        
        // Logging detallado
        onProxyReq: (proxyReq, req, res) => {
            const newPath = req.path.replace(new RegExp(`^${mountPath}`), opts.pathRewrite?.[`^${mountPath}`] || '');
            logger.info(`🔄 Proxy: ${req.method} ${req.path} -> ${opts.target}${newPath}`);
            
            // Preservar el body en caso de POST/PUT/PATCH
            if (req.body && Object.keys(req.body).length > 0) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        },
        
        onProxyRes: (proxyRes, req, res) => {
            logger.info(`✅ Response: ${proxyRes.statusCode} from ${opts.target}`);
        },
        
        onError: (err, req, res) => {
            logger.error(`❌ Proxy error for ${mountPath} -> ${opts.target}: ${err.message}`);
            if (!res.headersSent) {
                res.status(502).json({ 
                    error: 'Bad Gateway', 
                    details: err.message,
                    service: mountPath 
                });
            }
        }
    };

    const proxy = createProxyMiddleware(proxyConfig);
    app.use(mountPath, proxy);
    logger.info(`📍 Ruta proxy montada: ${mountPath} -> ${opts.target}`);
});

// ========================================
// FALLBACK 404
// ========================================
app.use((req, res) => {
    logger.warn(`⚠️ 404 - Ruta no encontrada: ${req.method} ${req.path}`);
    res.status(404).json({ 
        error: 'Not found',
        path: req.path,
        method: req.method 
    });
});

// ========================================
// ERROR HANDLER GLOBAL
// ========================================
app.use((err, req, res, next) => {
    logger.error(`💥 Error global: ${err.message}`, { stack: err.stack });
    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// ========================================
// SERVER + GRACEFUL SHUTDOWN
// ========================================
const server = app.listen(PORT, () => {
    logger.info(`🚀 Gateway running on port ${PORT}`);
    logger.info(`📡 Usuarios Service: ${process.env.USUARIOS_SERVICE_URL || 'http://localhost:3001'}`);
    logger.info(`🎫 Tickets Service: ${process.env.TICKETS_SERVICE_URL || 'http://localhost:3002'}`);
    logger.info(`💬 Chat Service: ${process.env.CHAT_SERVICE_URL || 'http://localhost:3003'}`);
    logger.info(`🔔 Notifications Service: ${process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3004'}`);
});

const shutdown = () => {
    logger.info('🛑 Shutting down gracefully...');
    server.close(() => {
        logger.info('✅ Server closed');
        process.exit(0);
    });
    
    // Forzar cierre después de 10 segundos
    setTimeout(() => {
        logger.error('❌ Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;