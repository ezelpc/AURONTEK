import { Router } from 'express';
import { notificacionController } from '../Controllers/notificacion.controller';

const router = Router();

// GET - Obtener notificaciones del usuario
router.get('/', notificacionController.listar);

// POST - Crear notificación (desde otros servicios con SERVICE_TOKEN)
router.post('/', notificacionController.crearNotificacion);

// PATCH - Marcar como leído (ANTES de la ruta /:id para evitar conflictos)
router.patch('/leer-todas', notificacionController.marcarTodasLeidas);
router.patch('/:id/leer', notificacionController.marcarLeida);

// POST - Enviar email del sistema (usado por otros servicios)
router.post('/system-email', notificacionController.enviarEmailSistema);

// DELETE - Eliminar notificaciones
router.delete('/:id', notificacionController.eliminar);
router.delete('/', notificacionController.eliminarTodas);

// GET - Contar no leídas
router.get('/no-leidas/count', notificacionController.contarNoLeidas);

// Preferencias (no implementado aún)
router.get('/preferencias', notificacionController.obtenerPreferencias);
router.put('/preferencias', notificacionController.actualizarPreferencias);

export default router;
