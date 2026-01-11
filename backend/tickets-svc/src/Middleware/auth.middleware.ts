import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

// Extend Express Request to include usuario
declare global {
  namespace Express {
    interface Request {
      usuario?: JwtPayload & {
        id: string;
        nombre: string;
        email: string; // ✅ Added email
        rol: string;
        empresaId?: string;
        permisos?: string[];
      };
    }
  }
}


export const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const header = req.header('Authorization');
  const token = header ? header.replace('Bearer ', '') : null;

  if (!token) {
    res.status(401).json({ msg: 'Token no proporcionado' });
    return;
  }

  // ✅ SERVICE TOKEN AUTHENTICATION (Priority Check)
  // Permite que otros microservicios (como ia-svc) se comuniquen internamente
  const serviceToken = process.env.SERVICE_TOKEN;
  if (serviceToken && token === serviceToken) {
    console.log('[AUTH] ✅ Authenticated via SERVICE_TOKEN');
    req.usuario = {
      id: 'service-account',
      nombre: 'System Service',
      email: 'system@aurontek.com',
      rol: undefined as any, // ⬅️ SIN ROL para trigger filtro de servicios internos
      permisos: ['*'], // Full access for services
    };
    return next();
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload & {
      id: string;
      nombre: string;
      email: string;
      rol: string;
      empresaId?: string;
      permisos?: string[];
    };


    req.usuario = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      // Silence common JWT errors (expired, malformed) to avoid log spam
      // console.debug('JWT invalido:', error.message);
      res.status(401).json({ msg: 'Token inválido' });
      return;
    }
    console.error('JWT unknown error:', error);
    res.status(401).json({ msg: 'Token inválido' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Legacy support or fallback
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      res.status(403).json({
        msg: 'No tiene permisos para realizar esta acción'
      });
      return;
    }
    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userPermissions = req.usuario?.permisos || [];

    console.log('[TICKETS AUTH] Checking permission:', permission);
    console.log('[TICKETS AUTH] User:', req.usuario?.nombre || req.usuario?.email);
    console.log('[TICKETS AUTH] User permissions:', userPermissions);
    console.log('[TICKETS AUTH] Has wildcard?', userPermissions.includes('*'));

    // Root Total Access
    if (userPermissions.includes('*')) {
      console.log('[TICKETS AUTH] ✅ GRANTED via wildcard');
      return next();
    }

    if (!userPermissions.includes(permission)) {
      console.log('[TICKETS AUTH] ❌ DENIED - Permission not found');
      res.status(403).json({
        msg: `Acceso denegado. Se requiere el permiso: ${permission}`
      });
      return;
    }

    console.log('[TICKETS AUTH] ✅ GRANTED via specific permission');
    next();
  };
};
