import { Router } from 'express';
import {
  getAllServicios,
  createServicio,
  updateServicio,
  deleteServicio,
  bulkCreateServicios,
  downloadTemplate
} from '../Controllers/servicio.controller';
import { auth, authorize } from '../Middleware/auth.middleware';

const router = Router();

// Rutas públicas (solo lectura para crear tickets)
router.get('/', getAllServicios);

// Rutas protegidas (solo administradores)
router.use(auth); // Requiere autenticación
router.use(authorize('admin-general', 'admin-interno', 'admin_empresa')); // Solo admins

router.post('/', createServicio);
router.put('/:id', updateServicio);
router.delete('/:id', deleteServicio);

// Carga masiva y plantilla
router.post('/bulk-upload', bulkCreateServicios);
router.get('/template', downloadTemplate);

export default router;
