import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { RequestHandler } from 'express';

export const createProxyRouter = (authLimiter: RequestHandler | null) => {
    const router = Router();
    const USUARIOS_SVC_URL = process.env.USUARIOS_SERVICE_URL || 'http://localhost:3001';
    const TICKETS_SVC_URL = process.env.TICKETS_SERVICE_URL || 'http://localhost:3002';

    // Solo aplicar authLimiter si está definido
    const authMiddleware = authLimiter ? [authLimiter] : [];

    console.log(`[PROXY CONFIG] Auth routes will proxy to: ${USUARIOS_SVC_URL}`);
    console.log(`[PROXY CONFIG] Companies routes will proxy to: ${USUARIOS_SVC_URL}/empresas`);
    console.log(`[PROXY CONFIG] Ticket routes will proxy to: ${TICKETS_SVC_URL}`);

    router.use('/auth', ...authMiddleware, createProxyMiddleware({
        target: USUARIOS_SVC_URL,
        changeOrigin: true,
        // When mounted at '/auth', Express strips that prefix and the proxied path
        // becomes '/login' for example. Rewrite leading '/' to '/auth/' so
        // '/login' -> '/auth/login' on the target service.
        pathRewrite: { '^/': '/auth/' },
    }));

    router.use('/users', createProxyMiddleware({
        target: USUARIOS_SVC_URL,
        changeOrigin: true,
        pathRewrite: { '^/users': '/usuarios' },
    }));

    router.use('/usuarios', createProxyMiddleware({
        target: USUARIOS_SVC_URL,
        changeOrigin: true,
        pathRewrite: { '^/': '/usuarios/' },
    }));

    router.use('/admins', createProxyMiddleware({
        target: USUARIOS_SVC_URL,
        changeOrigin: true,
        pathRewrite: { '^/': '/admins/' },
    }));

    router.use('/roles', createProxyMiddleware({
        target: USUARIOS_SVC_URL,
        changeOrigin: true,
        pathRewrite: { '^/': '/roles/' },
    }));

    router.use('/habilidades', createProxyMiddleware({
        target: USUARIOS_SVC_URL,
        changeOrigin: true,
        pathRewrite: { '^/': '/habilidades/' },
    }));

    router.use('/companies', createProxyMiddleware({
        target: USUARIOS_SVC_URL,
        changeOrigin: true,
        pathRewrite: {
            '^/': '/empresas/'  // When mounted on /companies, path will be / or /:id, rewrite to /empresas/
        },
        onProxyReq: (proxyReq: any, req: any, res: any) => {
            console.log(`[PROXY] Forwarding to: ${USUARIOS_SVC_URL}${proxyReq.path}`);
        },
        onError: (err: any, req: any, res: any) => {
            console.error(`[PROXY ERROR]`, err.message);
        }
    } as any));

    router.use('/tickets', createProxyMiddleware({
        target: TICKETS_SVC_URL,
        changeOrigin: true,
        pathRewrite: { '^/': '/tickets/' },
    }));

    router.use('/services', createProxyMiddleware({
        target: TICKETS_SVC_URL,
        changeOrigin: true,
        pathRewrite: { '^/': '/services/' },
    }));

    const NOTIFICACIONES_SVC_URL = process.env.NOTIFICACIONES_SERVICE_URL || 'http://localhost:3004';
    console.log(`[PROXY CONFIG] Notifications routes will proxy to: ${NOTIFICACIONES_SVC_URL}`);

    router.use('/notificaciones', createProxyMiddleware({
        target: NOTIFICACIONES_SVC_URL,
        changeOrigin: true,
        // No pathRewrite needed if we mount routes at / in notificaciones-svc, 
        // OR we can mount at /notificaciones and rewrite.
        // Let's assume notificaciones-svc will mount at root /, so we rewrite.
        pathRewrite: { '^/': '/' },
    }));


    const CHAT_SVC_URL = process.env.CHAT_SERVICE_URL || 'http://localhost:3003';
    console.log(`[PROXY CONFIG] Chat routes will proxy to: ${CHAT_SVC_URL}`);

    router.use('/chat', createProxyMiddleware({
        target: CHAT_SVC_URL,
        changeOrigin: true,
        pathRewrite: { '^/': '/' },
    }));

    return router;
};
