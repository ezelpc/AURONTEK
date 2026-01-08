import { Router } from 'express';
import {
  getAllServicios,
  createServicio,
  updateServicio,
  deleteServicio,
  bulkCreateServicios,
  downloadTemplate
} from '../Controllers/servicio.controller';
import { auth, authorize, requirePermission } from '../Middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación para saber quién es el usuario
router.use(auth);

// Rutas accesibles por cualquier usuario autenticado (para crear tickets)
router.get('/', getAllServicios);

// Rutas protegidas (solo administradores) para gestión del catálogo
// Usar permisos granulares: servicios.*_global para admin global, servicios.*_local para admin de empresa
router.post('/', (req, res, next) => {
  // Determinar si es admin global o local basado en el ámbito
  const isGlobalScope = req.body?.esGlobal || false;
  const requiredPermission = isGlobalScope ? 'servicios.create_global' : 'servicios.create_local';
  return requirePermission(requiredPermission)(req, res, next);
}, createServicio);

router.put('/:id', (req, res, next) => {
  const isGlobalScope = req.body?.esGlobal || false;
  const requiredPermission = isGlobalScope ? 'servicios.edit_global' : 'servicios.edit_local';
  return requirePermission(requiredPermission)(req, res, next);
}, updateServicio);

router.delete('/:id', (req, res, next) => {
  const isGlobalScope = req.query?.esGlobal === 'true';
  const requiredPermission = isGlobalScope ? 'servicios.delete_global' : 'servicios.delete_local';
  return requirePermission(requiredPermission)(req, res, next);
}, deleteServicio);

// Carga masiva y plantilla - requieren permiso de import
router.post('/bulk-upload', requirePermission('servicios.import'), bulkCreateServicios);
router.get('/template', downloadTemplate);

export default router;
