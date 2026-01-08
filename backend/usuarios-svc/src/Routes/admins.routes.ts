import express from 'express';
import adminController from '../Controllers/admin.controller';
import { verificarToken, tienePermiso } from '../Middleware/auth.middleware';
import { validateUserOrService } from '../Middleware/service.middleware';
import { PERMISOS } from '../Constants/permissions';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

// GET /api/admins - Listar todos los administradores
router.get('/', tienePermiso(PERMISOS.ADMINS_VIEW), adminController.listarAdmins);

// GET /api/admins/:id - Get admin details (for services or admins)
router.get('/:id', validateUserOrService, adminController.detalleAdmin);

// POST /api/admins - Crear un nuevo administrador (e.g., subroot)
router.post('/', tienePermiso(PERMISOS.ADMINS_CREATE), adminController.crearAdmin);

// DELETE /api/admins/:id - Eliminar un administrador
router.delete('/:id', tienePermiso(PERMISOS.ADMINS_DELETE), adminController.eliminarAdmin);

export default router;
