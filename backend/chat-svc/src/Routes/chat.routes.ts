import { Router } from 'express';
import { getChatHistory, saveMessage } from '../Controllers/chat.controller';

const router = Router();

// GET /:ticketId/mensajes - Obtener historial
router.get('/:ticketId/mensajes', getChatHistory);

// POST /:ticketId/mensajes - Enviar mensaje
router.post('/:ticketId/mensajes', saveMessage);

export default router;
