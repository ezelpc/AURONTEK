import { Router } from 'express';
import { verificarToken } from '../Middleware/auth.middleware';
import roleController from '../Controllers/role.controller';

const router = Router();

import { requirePermission } from '../Middleware/requirePermission';
import { PERMISSIONS } from '../Constants/permissions';

// Retrieve list of permissions (for UI)
// Maybe allow ROLES_VIEW too? Or just any logged in admin? 
// Let's stick to ROLES_VIEW for listing permissions to keep it simple.
router.get('/permissions', verificarToken, requirePermission(PERMISSIONS.ROLES_VIEW), roleController.listarPermisos);

// CRUD Roles
router.get('/', verificarToken, requirePermission(PERMISSIONS.ROLES_VIEW), roleController.listarRoles);
router.post('/', verificarToken, requirePermission(PERMISSIONS.ROLES_MANAGE), roleController.crearRole);
router.put('/:id', verificarToken, requirePermission(PERMISSIONS.ROLES_MANAGE), roleController.actualizarRole);
router.delete('/:id', verificarToken, requirePermission(PERMISSIONS.ROLES_MANAGE), roleController.eliminarRole);

export default router;
