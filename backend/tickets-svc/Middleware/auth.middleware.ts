import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

// Extend Express Request to include usuario
declare global {
  namespace Express {
    interface Request {
      usuario?: JwtPayload & {
        id: string;
        rol: string;
        empresaId?: string;
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
      rol: string;
      empresaId?: string;
    };

    req.usuario = decoded;
    next();
  } catch (error) {
    console.error('JWT error:', error);
    res.status(401).json({ msg: 'Token inválido' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      res.status(403).json({
        msg: 'No tiene permisos para realizar esta acción'
      });
      return;
    }
    next();
  };
};
