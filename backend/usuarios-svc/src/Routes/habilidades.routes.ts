import { Router } from 'express';
import habilidadController from '../Controllers/habilidad.controller';
import { verificarToken } from '../Middleware/auth.middleware';
import { requirePermission } from '../Middleware/requirePermission';
import { PERMISOS } from '../Constants/permissions';

const router = Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

// CRUD Habilidades
// (Ajustar permisos según corresponda, usando los disponibles en PERMISOS)
// Asumimos HABILITIES_VIEW/MANAGE existen, o usamos subroot/admin check por defecto.
// Si no existen en PERMISOS, usar users.view_all como fallback o agregarlos.
// Revisando Constants/permissions.ts, no hay HABILITIES. Usaremos USERS_MANAGE por ahora.

router.get('/', requirePermission(PERMISOS.HABILITIES_VIEW), habilidadController.listarHabilidades);

// Crear/Editar/Eliminar solo admin
router.post('/', requirePermission(PERMISOS.HABILITIES_MANAGE), habilidadController.crearHabilidad);
router.put('/:id', requirePermission(PERMISOS.HABILITIES_MANAGE), habilidadController.modificarHabilidad);
router.delete('/:id', requirePermission(PERMISOS.HABILITIES_MANAGE), habilidadController.eliminarHabilidad);

export default router;
