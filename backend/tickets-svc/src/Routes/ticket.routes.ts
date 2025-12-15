import express, { Router } from 'express';
import ticketController from '../Controllers/ticket.controller';
import estadisticasController from '../Controllers/estadisticas.controller';
import adminController from '../Controllers/ticket.admin.controller';
import { auth, authorize } from '../Middleware/auth.middleware';
import { validateServiceToken } from '../Middleware/service.middleware';

const router: Router = express.Router();

// Todas las rutas requieren autenticación (excepto las de servicio)
router.use(auth);

// ===== RUTAS DE ESTADÍSTICAS =====
router.get('/estadisticas/resolvers', estadisticasController.obtenerEstadisticasResolvers);
router.get('/estadisticas/quemados', estadisticasController.obtenerTicketsQuemados);
router.get('/estadisticas/calificaciones', estadisticasController.obtenerCalificaciones);
router.get('/estadisticas', estadisticasController.obtenerEstadisticasGenerales);

// ===== RUTAS DE TICKETS =====
// Crear ticket (cualquier usuario autenticado)
router.post('/', ticketController.crear);

// Listar tickets (filtrado según rol)
router.get('/', ticketController.listar);

// Obtener detalle de un ticket
router.get('/:id', ticketController.obtener);

// ✅ Verificar acceso al chat
router.get('/:id/acceso-chat', ticketController.verificarAccesoChat);

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

// ===== RUTAS DE ADMIN GENERAL =====
router.get('/admin/empresas', authorize('admin-general'), adminController.listarTicketsEmpresas);
router.get('/admin/internos', authorize('admin-general'), adminController.listarTicketsInternos);
router.get('/admin/:id', authorize('admin-general'), adminController.obtenerTicketDetalle);
router.patch('/admin/:id/asignar', authorize('admin-general'), adminController.asignarAgente);
router.patch('/admin/:id/estado', authorize('admin-general'), adminController.cambiarEstado);
router.patch('/admin/:id/prioridad', authorize('admin-general'), adminController.cambiarPrioridad);

export default router;