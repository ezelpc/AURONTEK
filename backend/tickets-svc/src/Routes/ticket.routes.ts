import express, { Router } from 'express';
import ticketController from '../Controllers/ticket.controller';
import estadisticasController from '../Controllers/estadisticas.controller';
import adminController from '../Controllers/ticket.admin.controller';
import { auth, authorize } from '../Middleware/auth.middleware';
import { validateServiceToken } from '../Middleware/service.middleware';

console.log('✅ [TICKETS] Cargando rutas de tickets (Orden arreglado)');
const router: Router = express.Router();

// Todas las rutas requieren autenticación (excepto las de servicio)
router.use(auth);

// ===== RUTAS DE ESTADÍSTICAS =====
router.get('/estadisticas/global', authorize('admin-general'), estadisticasController.obtenerEstadisticasGlobales);
router.get('/estadisticas/resolvers', estadisticasController.obtenerEstadisticasResolvers);
router.get('/estadisticas/quemados', estadisticasController.obtenerTicketsQuemados);
router.get('/estadisticas/calificaciones', estadisticasController.obtenerCalificaciones);
router.get('/estadisticas', estadisticasController.obtenerEstadisticasGenerales);

// ===== RUTAS DE TICKETS =====
// Crear ticket (cualquier usuario autenticado)
router.post('/', ticketController.crear);

// ✅ Subir adjuntos (Múltiples)
import uploadController, { uploadConfig } from '../Controllers/upload.controller';
router.post('/upload', uploadConfig.array('files', 10), uploadController.uploadFile);

// ===== RUTAS DE ADMIN GENERAL (DEBEN IR ANTES DE /:id) =====
router.get('/admin/empresas', authorize('admin-general'), adminController.listarTicketsEmpresas);
router.get('/admin/internos', authorize('admin-general'), adminController.listarTicketsInternos);
router.get('/admin/listado-global', authorize('admin-general'), adminController.listarTicketsGlobales);

router.get('/admin/:id', authorize('admin-general'), adminController.obtenerTicketDetalle);
router.patch('/admin/:id/asignar', authorize('admin-general'), adminController.asignarAgente);
router.patch('/admin/:id/estado', authorize('admin-general'), adminController.cambiarEstado);
router.patch('/admin/:id/prioridad', authorize('admin-general'), adminController.cambiarPrioridad);

// Listar tickets (filtrado según rol)
router.get('/', ticketController.listar);

// Obtener detalle de un ticket
router.get('/:id', ticketController.obtener);

// Obtener historial de cambios de un ticket
router.get('/:id/history', ticketController.obtenerHistorial);

// ✅ Verificar acceso al chat
router.get('/:id/verificar-acceso-chat', validateServiceToken, ticketController.verificarAccesoChat);

// ✅ NUEVO: Actualizar clasificación (solo IA service)
router.patch('/:id/clasificacion',
  validateServiceToken,
  ticketController.actualizarClasificacion
);

// ✅ NUEVO: Asignación automática por IA (solo IA service)
router.put('/:id/asignar-ia',
  validateServiceToken,
  ticketController.asignarIA
);

// Actualizar estado (soporte, beca-soporte, admin-interno)
router.put('/:id/estado',
  authorize('soporte', 'beca-soporte', 'admin-interno'),
  ticketController.actualizarEstado
);

// Asignar ticket manualmente (solo admin-interno)
router.put('/:id/asignar',
  authorize('admin-interno'),
  ticketController.asignar
);

// ✅ Delegar ticket a becario (solo soporte)
router.put('/:id/delegar',
  authorize('soporte'),
  ticketController.delegar
);

// ✅ Eliminar ticket (Solo Admin)
router.delete('/:id',
  authorize('admin-general', 'admin-subroot'),
  ticketController.eliminar
);

export default router;