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

    // Root Total Access
    if (userPermissions.includes('*')) {
      return next();
    }

    if (!userPermissions.includes(permission)) {
      res.status(403).json({
        msg: `Acceso denegado. Se requiere el permiso: ${permission}`
      });
      return;
    }
    next();
  };
};
