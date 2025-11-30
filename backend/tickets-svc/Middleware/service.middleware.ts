import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      isServiceCall?: boolean;
      serviceName?: string;
      usuario?: JwtPayload & {
        id: string;
        rol: string;
        empresaId?: string;
      };
    }
  }
}

/**
 * Middleware para validar tokens de comunicación entre servicios
 * Permite que los microservicios se comuniquen de forma segura sin JWT de usuario
 */
export const validateServiceToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const serviceName = req.headers['x-service-name'] as string | undefined;
  const serviceToken = process.env.SERVICE_TOKEN;

  // Extraer token del header
  const token = authHeader ? authHeader.replace('Bearer ', '') : null;

  // Validar que el token coincida con el SERVICE_TOKEN
  if (token === serviceToken && serviceName) {
    // Marcar como llamada de servicio
    req.isServiceCall = true;
    req.serviceName = serviceName;

    console.log(`✅ Llamada de servicio autorizada: ${serviceName}`);
    next();
    return;
  }

  // Si no es válido, denegar acceso
  res.status(403).json({
    msg: 'Acceso denegado: Token de servicio inválido o ausente'
  });
};

/**
 * Middleware que permite tanto usuarios autenticados como servicios
 */
export const validateUserOrService = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const serviceName = req.headers['x-service-name'] as string | undefined;
  const serviceToken = process.env.SERVICE_TOKEN;

  if (!authHeader) {
    res.status(401).json({ msg: 'Token no proporcionado' });
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  // Verificar si es un token de servicio
  if (token === serviceToken && serviceName) {
    req.isServiceCall = true;
    req.serviceName = serviceName;
    next();
    return;
  }

  // Si no es servicio, validar como JWT de usuario
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload & {
      id: string;
      rol: string;
      empresaId?: string;
    };

    req.usuario = decoded;
    req.isServiceCall = false;
    next();
  } catch (error) {
    res.status(401).json({ msg: 'Token inválido' });
  }
};

export default {
  validateServiceToken,
  validateUserOrService
};