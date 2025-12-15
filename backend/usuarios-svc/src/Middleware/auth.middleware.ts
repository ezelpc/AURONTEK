import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Usuario from '../Models/AltaUsuario.models';
import Role from '../Models/Role.model';

// Extend Express Request to include usuario
declare global {
  namespace Express {
    interface Request {
      usuario?: any;
    }
  }
}

/**
 * Middleware para verificar la validez de un JWT.
 */
export const verificarToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ msg: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const decodificado: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    // Fetch full user and permissions
    const usuarioFound = await Usuario.findById(decodificado.id).select('-contraseña');

    // Also check Admin collection if not found in Usuario? 
    // Usually Admin General is in 'admins' collection.
    // Logic: if not found in Usuario, check Admin.
    // However, for simplicity, let's assume we handle standard users first.
    // Admin General (Root) typically has *all* permissions or bypasses checks.

    if (usuarioFound) {
      // Load Dynamic Role Permissions
      // Search by Role Name AND (Company ID OR Global)
      const roleDef = await Role.findOne({
        nombre: usuarioFound.rol,
        $or: [
          { empresa: usuarioFound.empresa },
          { empresa: null }
        ],
        activo: true
      });

      req.usuario = {
        ...usuarioFound.toObject(),
        permissions: roleDef ? roleDef.permisos : []
      };
    } else {
      // Fallback or Admin check
      req.usuario = decodificado;
    }

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(400).json({ msg: 'Token no válido o expirado.' });
  }
};

/**
 * Middleware para verificar si el rol es 'admin-general'.
 * Usar DESPUÉS de verificarToken.
 */
export const esAdminGeneral = (req: Request, res: Response, next: NextFunction) => {
  if (req.usuario.rol !== 'admin-general') {
    return res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de Admin General.' });
  }
  next();
};

/**
 * Middleware para verificar si el rol es 'admin-subroot'.
 * Usar DESPUÉS de verificarToken.
 */
export const esAdminSubroot = (req: Request, res: Response, next: NextFunction) => {
  if (req.usuario.rol !== 'admin-subroot') {
    return res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de Admin Subroot.' });
  }
  next();
};

/**
 * Middleware para verificar si el rol es admin-general O admin-subroot.
 * Usar DESPUÉS de verificarToken.
 */
export const esAdminSistema = (req: Request, res: Response, next: NextFunction) => {
  if (!['admin-general', 'admin-subroot'].includes(req.usuario.rol)) {
    return res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de administrador del sistema.' });
  }
  next();
};

/**
 * Middleware para verificar si el rol es 'admin-interno'.
 * Usar DESPUÉS de verificarToken.
 */
export const esAdminInterno = (req: Request, res: Response, next: NextFunction) => {
  if (req.usuario.rol !== 'admin-interno') {
    return res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de Admin Interno.' });
  }
  next();
};

/**
 * Middleware para verificar si el rol es 'soporte'.
 * Usar DESPUÉS de verificarToken.
 */
export const esSoporte = (req: Request, res: Response, next: NextFunction) => {
  if (req.usuario.rol !== 'soporte') {
    return res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de Soporte.' });
  }
  next();
};

/**
 * Middleware para verificar permisos de gestión de usuarios.
 * Permite: admin-general, admin-subroot, admin-interno.
 */
export const esGestorUsuarios = (req: Request, res: Response, next: NextFunction) => {
  if (!['admin-general', 'admin-subroot', 'admin-interno'].includes(req.usuario.rol)) {
    return res.status(403).json({ msg: 'Acceso denegado. Se requiere ser administrador.' });
  }
  next();
};

/**
 * Middleware para verificar si el usuario tiene un permiso específico.
 * Asume que `req.usuario` ya está poblado (usar después de `verificarToken`).
 * @param permisoKey Clave del permiso a verificar (e.g., 'users.create')
 */
export const tienePermiso = (permisoKey: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Admin General (Super Admin) bypasses permission checks (Optionally)
    // Or we assume they have all permissions injected.
    if (req.usuario.rol === 'admin-general') {
      return next();
    }

    const permisosUsuario = req.usuario.permissions || []; // Changed from 'permisos' to 'permissions' based on line 52
    if (permisosUsuario.includes(permisoKey)) {
      return next();
    }

    return res.status(403).json({ msg: `Acceso denegado. Se requiere el permiso: ${permisoKey}` });
  };
};

/**
 * Middleware opcional: Verifica token si existe, pero no bloquea si no.
 * Útil para rutas públicas que pueden personalizarse si hay usuario (e.g., precios VIP).
 */
export const verificarTokenOpcional = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Continuar sin usuario
    return next();
  }

  try {
    const decodificado: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const usuarioFound = await Usuario.findById(decodificado.id).select('-contraseña');

    if (usuarioFound) {
      const roleDef = await Role.findOne({
        nombre: usuarioFound.rol,
        $or: [{ empresa: usuarioFound.empresa }, { empresa: null }],
        activo: true
      });
      req.usuario = {
        ...usuarioFound.toObject(),
        permissions: roleDef ? roleDef.permisos : []
      };
    } else {
      req.usuario = decodificado;
    }
    next();
  } catch (error) {
    // Token invalido pero es opcional, continuamos como anonimo? 
    // O avisamos? Generalmente opcional ignora errores de token y trata como anonimo.
    console.warn('Token opcional invalido:', error);
    next();
  }
};