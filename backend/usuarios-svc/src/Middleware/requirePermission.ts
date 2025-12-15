import { Request, Response, NextFunction } from 'express';
import Role from '../Models/Role.model';

/**
 * Middleware para requerir un permiso específico.
 * Valida contra la base de datos (Role) y no solo contra el token.
 * Incluye bypass para 'admin-general' (Super Admin).
 */
export const requirePermission = (requiredPermission: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 1. Obtener usuario del request (inyectado por authMiddleware)
            const user = (req as any).usuario;

            if (!user) {
                return res.status(401).json({ msg: 'Acceso no autorizado. Token faltante o inválido.' });
            }

            // 2. Bypass para Super Admin
            if (user.rol === 'admin-general') {
                return next();
            }

            // 3. Buscar Rol y Permisos en BD (Single Source of Truth)
            // Buscamos por slug y empresaId (o null para roles globales)
            const roleDoc = await Role.findOne({
                slug: user.rol,
                $or: [{ empresa: user.empresaId }, { empresa: null }]
            });

            if (!roleDoc) {
                return res.status(403).json({ msg: 'Rol no encontrado o inválido para esta empresa.' });
            }

            // 4. Validar Permiso
            const hasPermission = roleDoc.permisos.includes(requiredPermission);

            if (!hasPermission) {
                return res.status(403).json({
                    msg: `Acceso denegado. Se requiere el permiso: ${requiredPermission}`
                });
            }

            next();

        } catch (error) {
            console.error('Error en requirePermission:', error);
            return res.status(500).json({ msg: 'Error interno verificando permisos.' });
        }
    };
};
