import express from 'express';
import dashboardController from '../Controllers/dashboard.controller';
import { verificarToken } from '../Middleware/auth.middleware';
import { requirePermission } from '../Middleware/requirePermission';
import { PERMISOS } from '../Constants/permissions';

const router = express.Router();

router.get(
    '/dashboard/stats',
    verificarToken,
    requirePermission(PERMISOS.USERS_VIEW_GLOBAL), // Super Admin / Support Global
    dashboardController.getStats
);

export default router;
