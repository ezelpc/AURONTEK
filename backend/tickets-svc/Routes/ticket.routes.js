// Routes/tickets.routes.js
import express from 'express';
const router = express.Router();
import ticketController from '../Controllers/ticket.controller.js';
import { auth, authorize } from '../Middleware/auth.middleware.js';
import { validateServiceToken } from '../Middleware/service.middleware.js';

// Todas las rutas requieren autenticación (excepto las de servicio)
router.use(auth);

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

export default router;