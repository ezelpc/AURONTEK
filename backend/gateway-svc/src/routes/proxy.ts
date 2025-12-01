import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { RequestHandler } from 'express';

export const createProxyRouter = (authLimiter: RequestHandler | null) => {
    const router = Router();
    // Support both env names: older docker-compose used USUARIOS_SERVICE_URL
    const USUARIOS_SVC_URL = process.env.USUARIOS_SVC_URL || process.env.USUARIOS_SERVICE_URL || 'http://usuarios-svc:3001';

    // Solo aplicar authLimiter si está definido
    const authMiddleware = authLimiter ? [authLimiter] : [];

    console.log(`[PROXY CONFIG] Auth routes will proxy to: ${USUARIOS_SVC_URL}`);

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

    router.use('/companies', createProxyMiddleware({
        target: USUARIOS_SVC_URL,
        changeOrigin: true,
        pathRewrite: { '^/companies': '/empresas' },
    }));

    return router;
};
