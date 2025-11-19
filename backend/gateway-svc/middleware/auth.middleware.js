import jwt from 'jsonwebtoken';
import { logger } from './logger.middleware.js';

const revokedTokens = new Set();

export const publicRoutes = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/verify-email',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/health',
  '/api/v1/health',
  // 👇 AGREGAMOS ESTA RUTA PARA QUE EL LOGIN DE ADMIN PASE SIN TOKEN
  '/api/admin-sistema/login' 
];

const verifyToken = (req) => {
  const header = req.headers.authorization;
  const token = header?.split(' ')[1];
  if (!token) throw new Error('Token no proporcionado');
  if (revokedTokens.has(token)) throw new Error('Token revocado');
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    logger.error('Error al verificar token:', err.message);
    throw new Error('Token inválido');
  }
};

export const authMiddleware = (req, res, next) => {
  // Si la ruta está en la lista pública, pasamos sin verificar token
  if (publicRoutes.includes(req.path)) return next();
  
  try {
    const decoded = verifyToken(req);
    req.user = decoded;
    next();
  } catch (err) {
    // Este es el error 401 que estabas viendo
    return res.status(401).json({ error: 'Unauthorized', message: err.message });
  }
};

export const revokeToken = (token) => {
  revokedTokens.add(token);
  setTimeout(() => revokedTokens.delete(token), 24 * 60 * 60 * 1000);
};