import express from 'express';
import adminController from '../Controllers/admin.controller';
import { verificarToken } from '../Middleware/auth.middleware';
import { requirePermission } from '../Middleware/requirePermission';
import { PERMISOS } from '../Constants/permissions';

const router = express.Router();

// All routes in this file require root-level permissions.
// The `requirePermission` middleware will check if the user has '*' or 'admins.manage'.

// GET /api/admins - Listar todos los administradores
router.get(
    '/',
    verificarToken,
    requirePermission(PERMISOS.ADMINS_MANAGE),
    adminController.listarAdmins
);

// POST /api/admins - Crear un nuevo administrador (e.g., subroot)
router.post(
    '/',
    verificarToken,
    requirePermission(PERMISOS.ADMINS_MANAGE),
    adminController.crearAdmin
);

// DELETE /api/admins/:id - Eliminar un administrador
router.delete(
    '/:id',
    verificarToken,
    requirePermission(PERMISOS.ADMINS_MANAGE),
    adminController.eliminarAdmin
);

export default router;