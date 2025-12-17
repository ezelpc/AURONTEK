import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para requerir un permiso específico.
 * Valida contra el array de permisos del usuario (inyectado en req.usuario).
 * Incluye bypass para Root ('*').
 */
export const requirePermission = (requiredPermission: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 1. Obtener usuario del request (inyectado por authMiddleware)
            const user = (req as any).usuario;

            console.log('[REQUIRE_PERMISSION DEBUG] Required:', requiredPermission);
            console.log('[REQUIRE_PERMISSION DEBUG] User:', JSON.stringify(user, null, 2));

            if (!user) {
                return res.status(401).json({ msg: 'Acceso no autorizado. Token faltante o inválido.' });
            }

            // 2. Bypass para Super Admin (Root) via flag o permiso wildcard
            // En auth.controller asignamos ['*'] a Root.
            const userPermissions: string[] = user.permisos || [];

            console.log('[REQUIRE_PERMISSION DEBUG] User permissions array:', userPermissions);
            console.log('[REQUIRE_PERMISSION DEBUG] Checking for wildcard (*):', userPermissions.includes('*'));

            if (userPermissions.includes('*')) {
                console.log('[REQUIRE_PERMISSION DEBUG] GRANTED via wildcard');
                return next();
            }

            // 3. Validar Permiso
            const hasPermission = userPermissions.includes(requiredPermission);

            console.log('[REQUIRE_PERMISSION DEBUG] Has specific permission:', hasPermission);

            if (!hasPermission) {
                console.log('[REQUIRE_PERMISSION DEBUG] DENIED - missing permission');
                return res.status(403).json({
                    msg: `Acceso denegado. Se requiere el permiso: ${requiredPermission}`
                });
            }

            console.log('[REQUIRE_PERMISSION DEBUG] GRANTED via specific permission');
            next();

        } catch (error) {
            console.error('Error en requirePermission:', error);
            return res.status(500).json({ msg: 'Error interno verificando permisos.' });
        }
    };
};

