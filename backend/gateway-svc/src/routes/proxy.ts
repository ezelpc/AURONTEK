import { Router } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { RequestHandler } from 'express';

// Helper function to remove CORS headers from proxied responses
// Gateway handles CORS, microservices should NOT send CORS headers
const removeCorsHeaders = (proxyRes: any, req: any, res: any) => {
    delete proxyRes.headers['access-control-allow-origin'];
    delete proxyRes.headers['access-control-allow-credentials'];
    delete proxyRes.headers['access-control-allow-methods'];
    delete proxyRes.headers['access-control-allow-headers'];
    delete proxyRes.headers['access-control-expose-headers'];
    delete proxyRes.headers['access-control-max-age'];
};

export const createProxyRouter = (authLimiter: RequestHandler | null) => {
    const router = Router();
    const USUARIOS_SVC_URL = process.env.USUARIOS_SERVICE_URL || 'http://localhost:3001';
    const TICKETS_SVC_URL = process.env.TICKETS_SERVICE_URL || 'http://localhost:3002';
    const CHAT_SVC_URL = process.env.CHAT_SERVICE_URL || 'http://localhost:3003';
    const NOTIFICACIONES_SVC_URL = process.env.NOTIFICACIONES_SERVICE_URL || 'http://localhost:3004';
    const IA_SVC_URL = process.env.IA_SERVICE_URL || 'http://localhost:3005';

    // Solo aplicar authLimiter si está definido
    const authMiddleware = authLimiter ? [authLimiter] : [];

    console.log(`[PROXY CONFIG] Auth routes will proxy to: ${USUARIOS_SVC_URL}`);
    console.log(`[PROXY CONFIG] Tickets routes will proxy to: ${TICKETS_SVC_URL}`);
    console.log(`[PROXY CONFIG] Chat routes will proxy to: ${CHAT_SVC_URL}`);
    console.log(`[PROXY CONFIG] Notifications routes will proxy to: ${NOTIFICACIONES_SVC_URL}`);
    console.log(`[PROXY CONFIG] IA routes will proxy to: ${IA_SVC_URL}`);

    /**
     * IMPORTANT: How Express Router + http-proxy-middleware works:
     * 
     * When router is mounted at /api in app.ts:
     * 1. Request: POST /api/auth/login
     * 2. Express strips /api, router receives: /auth/login
     * 3. router.use('/auth', ...) matches and strips /auth
     * 4. Proxy middleware receives: /login
     * 5. We need to prepend /auth back using pathRewrite
     */

    // Auth routes
    router.use('/auth', ...authMiddleware, createProxyMiddleware({
        target: USUARIOS_SVC_URL,
        changeOrigin: true,
        pathRewrite: (path) => {
            // path here is already stripped of /auth by Express router
            // We need to add it back: /login -> /auth/login
            const newPath = '/auth' + path;
            console.log(`[PROXY AUTH] Rewriting: ${path} -> ${newPath}`);
            return newPath;
        },
        onProxyRes: (proxyRes: any, req: any, res: any) => {
            // Remove CORS headers from proxied response - Gateway handles CORS
            delete proxyRes.headers['access-control-allow-origin'];
            delete proxyRes.headers['access-control-allow-credentials'];
            delete proxyRes.headers['access-control-allow-methods'];
            delete proxyRes.headers['access-control-allow-headers'];
        },
        logLevel: 'debug'
    } as Options));

    // Users routes (translate to usuarios)
    router.use('/users', createProxyMiddleware({
        target: USUARIOS_SVC_URL,
        changeOrigin: true,
        pathRewrite: (path) => '/usuarios' + path,
        onProxyRes: removeCorsHeaders
    } as Options));

    // Usuarios routes
    router.use('/usuarios', createProxyMiddleware({
        target: USUARIOS_SVC_URL,
        changeOrigin: true,
        pathRewrite: (path) => '/usuarios' + path,
        onProxyRes: removeCorsHeaders
    } as Options));

    // Admins routes
    router.use('/admins', createProxyMiddleware({
        target: USUARIOS_SVC_URL,
        changeOrigin: true,
        pathRewrite: (path) => '/admins' + path,
        onProxyRes: removeCorsHeaders
    } as Options));

    // Roles routes
    router.use('/roles', createProxyMiddleware({
        target: USUARIOS_SVC_URL,
        changeOrigin: true,
        pathRewrite: (path) => '/roles' + path,
        onProxyRes: removeCorsHeaders
    } as Options));

    // Habilidades routes - Special handling for file uploads
    router.use('/habilidades', createProxyMiddleware({
        target: USUARIOS_SVC_URL,
        changeOrigin: true,
        pathRewrite: (path) => '/habilidades' + path,
        onProxyRes: removeCorsHeaders,
        onProxyReq: (proxyReq: any, req: any, res: any) => {
            const contentType = req.headers['content-type'] || '';
            const isMultipart = contentType.includes('multipart/form-data');

            if (req.method === 'POST') {
                console.log(`[GATEWAY DEBUG] Proxying POST to: ${req.originalUrl} (Multipart: ${isMultipart})`);

                if (isMultipart) {
                    // For multipart, we MUST NOT touch the body or set headers if we want to stream
                    console.log('🚀 [GATEWAY] Streaming multipart request untouched');
                    return;
                }

                if (req.body && Object.keys(req.body).length > 0) {
                    const bodyData = JSON.stringify(req.body);
                    proxyReq.setHeader('Content-Type', 'application/json');
                    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                    proxyReq.write(bodyData);
                }
            }
        }
    } as Options));

    // Companies routes (translate to empresas)
    router.use('/companies', createProxyMiddleware({
        target: USUARIOS_SVC_URL,
        changeOrigin: true,
        pathRewrite: (path) => '/empresas' + path,
        onProxyRes: removeCorsHeaders
    } as Options));

    // Empresas routes
    router.use('/empresas', createProxyMiddleware({
        target: USUARIOS_SVC_URL,
        changeOrigin: true,
        pathRewrite: (path) => '/empresas' + path,
        onProxyRes: removeCorsHeaders
    } as Options));

    // Services routes
    router.use('/services', createProxyMiddleware({
        target: TICKETS_SVC_URL,
        changeOrigin: true,
        pathRewrite: (path) => '/services' + path,
        onProxyRes: removeCorsHeaders
    } as Options));

    // Tickets routes
    router.use('/tickets', createProxyMiddleware({
        target: TICKETS_SVC_URL,
        changeOrigin: true,
        pathRewrite: (path) => {
            const newPath = '/tickets' + path;
            console.log(`[PROXY TICKETS] Original path: ${path}`);
            console.log(`[PROXY TICKETS] Rewritten path: ${newPath}`);
            console.log(`[PROXY TICKETS] Full URL: ${TICKETS_SVC_URL}${newPath}`);
            return newPath;
        },
        logLevel: 'debug',
        onProxyReq: (proxyReq: any, req: any, res: any) => {
            console.log(`[PROXY TICKETS] Sending request to: ${TICKETS_SVC_URL}${proxyReq.path}`);
        },
        onProxyRes: removeCorsHeaders,
        onError: (err: any, req: any, res: any) => {
            console.error(`[PROXY TICKETS ERROR]`, err.message);
        }
    } as Options));



    // Chat routes
    // Chat routes
    router.use('/chat', createProxyMiddleware({
        target: CHAT_SVC_URL,
        changeOrigin: true,
        pathRewrite: (path, req) => {
            console.log(`[PROXY DEBUG CHAT] Method: ${req.method} URL: ${req.url} PathArg: ${path}`);
            let newPath = path.replace(/\/chat/i, '');
            if (!newPath.startsWith('/')) newPath = '/' + newPath;
            console.log(`[PROXY CHAT] Rewrite: ${path} -> ${newPath}`);
            return newPath;
        },
        onProxyRes: removeCorsHeaders,
        ws: true
    } as Options));

    // Notificaciones routes
    router.use('/notificaciones', createProxyMiddleware({
        target: NOTIFICACIONES_SVC_URL,
        changeOrigin: true,
        pathRewrite: (path, req) => {
            console.log(`[PROXY DEBUG NOTIF] Method: ${req.method} URL: ${req.url} PathArg: ${path}`);
            let newPath = path.replace(/\/notificaciones/i, '');
            if (!newPath.startsWith('/')) newPath = '/' + newPath;
            console.log(`[PROXY NOTIF] Rewrite: ${path} -> ${newPath}`);
            return newPath;
        },
        onProxyRes: removeCorsHeaders
    } as Options));

    // IA routes
    router.use('/ia', createProxyMiddleware({
        target: IA_SVC_URL,
        changeOrigin: true,
        pathRewrite: (path) => '/ia' + path,
        onProxyRes: removeCorsHeaders
    } as Options));

    // Uploads (static files from tickets-svc)
    router.use('/uploads', createProxyMiddleware({
        target: TICKETS_SVC_URL,
        changeOrigin: true,
        pathRewrite: (path) => '/uploads' + path
    } as Options));

    return router;
};
