import express from 'express';
import habilidadController from '../Controllers/habilidad.controller';
import { verificarToken } from '../Middleware/auth.middleware';
import { requirePermission } from '../Middleware/requirePermission';
import { PERMISOS } from '../Constants/permissions';

const router = express.Router();

// GET /api/habilidades - Listar todas las habilidades (para selects en frontend)
// Cualquier usuario autenticado puede ver la lista de habilidades disponibles.
router.get(
    '/',
    verificarToken,
    habilidadController.listarHabilidades
);

// POST /api/habilidades - Crear una habilidad
router.post(
    '/',
    verificarToken,
    requirePermission(PERMISOS.HABILITIES_CREATE),
    habilidadController.crearHabilidad
);

// PUT /api/habilidades/:id - Modificar una habilidad
router.put(
    '/:id',
    verificarToken,
    requirePermission(PERMISOS.HABILITIES_EDIT),
    habilidadController.modificarHabilidad
);

// DELETE /api/habilidades/:id - Eliminar una habilidad
router.delete(
    '/:id',
    verificarToken,
    requirePermission(PERMISOS.HABILITIES_DELETE),
    habilidadController.eliminarHabilidad
);

export default router;