import { Router } from 'express';
import { verificarToken } from '../Middleware/auth.middleware';
import roleController from '../Controllers/role.controller';

const router = Router();

import { requirePermission } from '../Middleware/requirePermission';
import { PERMISOS } from '../Constants/permissions';

// Retrieve list of permissions (for UI)
// Maybe allow ROLES_VIEW too? Or just any logged in admin? 
// Let's stick to ROLES_VIEW for listing permissions to keep it simple.
router.get('/permissions', verificarToken, requirePermission(PERMISOS.ROLES_VIEW), roleController.listarPermisos);

// CRUD Roles
router.get('/', verificarToken, requirePermission(PERMISOS.ROLES_VIEW), roleController.listarRoles);
router.post('/', verificarToken, requirePermission([PERMISOS.ROLES_CREATE, PERMISOS.ROLES_EDIT]), roleController.crearRole);
router.put('/:id', verificarToken, requirePermission(PERMISOS.ROLES_EDIT), roleController.actualizarRole);
router.delete('/:id', verificarToken, requirePermission(PERMISOS.ROLES_DELETE), roleController.eliminarRole);

export default router;
