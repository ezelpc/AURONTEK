import { Request, Response, NextFunction } from 'express';
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

/**
 * CSRF Protection Middleware
 * Protege contra ataques Cross-Site Request Forgery
 */

// Configurar cookie parser (requerido para csurf)
export const csrfCookieParser = cookieParser();

// Configurar CSRF protection
export const csrfProtection = csrf({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
        sameSite: 'strict',
        maxAge: 3600000 // 1 hora
    }
});

/**
 * Endpoint para obtener el CSRF token
 * El frontend debe llamar a este endpoint antes de hacer requests que modifiquen datos
 */
export const getCsrfToken = (req: Request, res: Response) => {
    res.json({ csrfToken: req.csrfToken() });
};

/**
 * Error handler para CSRF
 */
export const csrfErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.code !== 'EBADCSRFTOKEN') {
        return next(err);
    }

    // CSRF token inválido
    console.warn(`⚠️  [CSRF] Invalid token from IP: ${req.ip}`);
    res.status(403).json({
        error: 'Invalid CSRF token',
        message: 'La sesión ha expirado. Por favor, recarga la página.'
    });
};
