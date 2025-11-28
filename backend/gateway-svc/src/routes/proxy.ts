import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { RequestHandler } from 'express';

export const createProxyRouter = (authLimiter: RequestHandler | null) => {
    const router = Router();
    const USUARIOS_SVC_URL = process.env.USUARIOS_SVC_URL || 'http://localhost:3001';

    // Solo aplicar authLimiter si está definido
    const authMiddleware = authLimiter ? [authLimiter] : [];

    console.log(`[PROXY CONFIG] Auth routes will proxy to: ${USUARIOS_SVC_URL}`);

    router.use('/auth', ...authMiddleware, createProxyMiddleware({
        target: USUARIOS_SVC_URL,
        changeOrigin: true,
        pathRewrite: { '^': '/auth' }, // Add /auth back (Express consumed it)
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
