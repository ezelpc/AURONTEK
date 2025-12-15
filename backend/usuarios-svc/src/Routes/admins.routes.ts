import express from 'express';
import adminController from '../Controllers/admin.controller';
import { verificarToken, esAdminSistema } from '../Middleware/auth.middleware';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

// POST /api/admins - Crear admin (solo admin-general y admin-subroot)
router.post('/', esAdminSistema, adminController.crearAdmin);

// GET /api/admins - Listar admins
router.get('/', esAdminSistema, adminController.listarAdmins);

// DELETE /api/admins/:id - Eliminar admin (solo admin-general)
router.delete('/:id', adminController.eliminarAdmin);

export default router;
