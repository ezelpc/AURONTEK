import express from 'express';
import authController from '../Controllers/auth.controller';
import { verificarToken, esAdminInterno } from '../Middleware/auth.middleware';

const router = express.Router();

router.post('/login', authController.login);
router.post('/validate-code', authController.validarCodigoAcceso);
router.post('/register', [verificarToken, esAdminInterno], authController.register);
router.post('/logout', verificarToken, authController.logout);
router.get('/check', verificarToken, authController.check);

export default router;
