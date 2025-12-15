import { Router } from 'express';
import { getChatHistory } from '../Controllers/chat.controller';

const router = Router();

router.get('/:ticketId/historial', getChatHistory);

export default router;
