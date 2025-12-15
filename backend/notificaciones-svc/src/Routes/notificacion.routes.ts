import { Router } from 'express';
import { notificacionController } from '../Controllers/notificacion.controller';

const router = Router();

router.get('/', notificacionController.listar);
router.patch('/:id/leer', notificacionController.marcarLeida);
router.patch('/leer-todas', notificacionController.marcarTodasLeidas);
router.delete('/:id', notificacionController.eliminar);
router.get('/no-leidas/count', notificacionController.contarNoLeidas);
router.get('/preferencias', notificacionController.obtenerPreferencias);
router.put('/preferencias', notificacionController.actualizarPreferencias);

export default router;
