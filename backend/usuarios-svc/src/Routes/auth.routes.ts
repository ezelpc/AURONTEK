import express from 'express';
import authController from '../Controllers/auth.controller';
import { verificarToken, esAdminInterno } from '../Middleware/auth.middleware';

const router = express.Router();

router.post('/login', authController.login);
router.post('/validate-code', authController.validarCodigoAcceso);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/register', [verificarToken, esAdminInterno], authController.register);
router.post('/logout', verificarToken, authController.logout);
router.put('/status', verificarToken, authController.updateStatus);
router.get('/check', verificarToken, authController.check);
router.get('/refresh-permissions', verificarToken, authController.refreshPermissions);

export default router;
