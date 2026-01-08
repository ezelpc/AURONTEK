import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Usuario from '../Models/AltaUsuario.models';


import Admin from '../Models/Admin.model';

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
    console.log('[AUTH DEBUG] Token received:', token?.substring(0, 20) + '...');
    console.log('[AUTH DEBUG] Token length:', token?.length);
    const decodificado: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    // 1. Buscar en Colección Usuarios
    let usuarioFound: any = await Usuario.findById(decodificado.id).select('-contraseña');

    // 2. Si no es usuario, buscar en Colección Admins
    if (!usuarioFound) {
      usuarioFound = await Admin.findById(decodificado.id); // Admin doesn't have select param in finding logic usually but let's be safe
    }

    if (usuarioFound) {
      const userObj = usuarioFound.toObject();
      // Normalizar permisos: DB usa 'permiso' (singular) en algunos registros antiguos/manuales
      let permisos = userObj.permisos || userObj.permissions || [];
      const permisoSingular = (userObj as any).permiso || (usuarioFound as any).permiso; // Check both obj and doc

      if (permisos.length === 0 && permisoSingular) {
        console.log('[AUTH DEBUG] Normalizing singular permission:', permisoSingular);
        permisos = [permisoSingular];
      }

      // --- FIX: MERGE ROLE PERMISSIONS ---
      // If user has a role and company, fetch role permissions and merge
      if (userObj.rol && userObj.rol !== 'admin-general' && userObj.rol !== 'admin-subroot') {
        try {
          const RolModel = (await import('../Models/Role.model')).default;
          // Buscar por nombre O slug
          const roleDoc = await RolModel.findOne({
            $and: [
              { $or: [{ nombre: userObj.rol }, { slug: userObj.rol }] },
              { $or: [{ empresa: userObj.empresa }, { empresa: null }] }
            ]
          });

          if (roleDoc && roleDoc.permisos) {
            console.log(`[AUTH DEBUG] Role found: ${roleDoc.slug} (${roleDoc.nombre}). Merging ${roleDoc.permisos.length} permissions.`);
            permisos = Array.from(new Set([...permisos, ...roleDoc.permisos]));

            // NORMALIZE ROLE SLUG: Controllers expect 'admin-interno', not 'Administrador Interno'
            if (roleDoc.slug) {
              userObj.rol = roleDoc.slug;
            }
          } else {
            console.warn(`[AUTH WARNING] Role '${userObj.rol}' not found for company ${userObj.empresa}. Permissions not merged.`);
          }
        } catch (err) {
          console.error('[AUTH ERROR] Failed to merge role permissions:', err);
        }
      }

      // --- FALLBACK REMOVED: Strict RBAC enforcement ---
      // Permissions must come from the Role definition in DB or the User document.
      // "admin-interno" is no longer hardcoded with special privileges.

      req.usuario = {
        ...userObj,
        empresaId: userObj.empresa, // Map to expected field name
        permisos: permisos
      };
    } else {
      // Fallback: si no existe en BD (raro si tiene token válido), usar datos del token
      req.usuario = decodificado;
    }

    next();
  } catch (error) {
    // FALLBACK: Service Token Authentication
    // Si el JWT falla, verificamos si es un token de servicio (API Key)
    if (process.env.SERVICE_TOKEN && token === process.env.SERVICE_TOKEN) {
      console.log('[AUTH DEBUG] Authenticated via SERVICE_TOKEN');
      (req as any).usuario = {
        id: 'service-account',
        nombre: 'System Service',
        rol: 'admin-general', // Use admin-general for full system access
        permisos: ['*'],
        esService: true
      };
      return next();
    }

    console.error('Auth Middleware Error:', error);
    return res.status(401).json({ msg: 'Token no válido o expirado.' });
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
    console.log('[PERMISO DEBUG] Checking permission:', permisoKey);
    console.log('[PERMISO DEBUG] User rol:', req.usuario?.rol);
    console.log('[PERMISO DEBUG] User permisos:', req.usuario?.permisos);

    // Admin General (Super Admin) bypasses permission checks (Optionally)
    // Or we assume they have all permissions injected.
    if (req.usuario.rol === 'admin-general') {
      console.log('[PERMISO DEBUG] Admin-general bypass activated');
      return next();
    }

    const permisosUsuario = req.usuario.permisos || []; // Usar 'permisos' consistentemente

    // Check for wildcard permission
    if (permisosUsuario.includes('*')) {
      console.log('[PERMISO DEBUG] Wildcard permission (*) granted');
      return next();
    }

    if (permisosUsuario.includes(permisoKey)) {
      console.log('[PERMISO DEBUG] Specific permission granted');
      return next();
    }

    console.log('[PERMISO DEBUG] Permission DENIED');
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
      req.usuario = {
        ...usuarioFound.toObject(),
        // Soporte para ambos nombres de campo
        permisos: usuarioFound.permisos || usuarioFound.permissions || []
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