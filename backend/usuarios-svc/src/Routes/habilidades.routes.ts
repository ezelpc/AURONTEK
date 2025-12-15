import { Router } from 'express';
import habilidadController from '../Controllers/habilidad.controller';
import { verificarToken } from '../Middleware/auth.middleware';
import { requirePermission } from '../Middleware/requirePermission';
import { PERMISSIONS } from '../Constants/permissions';

const router = Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

// GET /api/habilidades (Ver)
router.get('/', requirePermission(PERMISSIONS.HABILITIES_VIEW), habilidadController.listarHabilidades);

// POST /api/habilidades (Crear) - Manage Permission or Admin System
router.post('/', requirePermission(PERMISSIONS.HABILITIES_MANAGE), habilidadController.crearHabilidad);

// PUT /api/habilidades/:id (Editar)
router.put('/:id', requirePermission(PERMISSIONS.HABILITIES_MANAGE), habilidadController.actualizarHabilidad);

// DELETE /api/habilidades/:id (Eliminar)
router.delete('/:id', requirePermission(PERMISSIONS.HABILITIES_MANAGE), habilidadController.eliminarHabilidad);

export default router;
