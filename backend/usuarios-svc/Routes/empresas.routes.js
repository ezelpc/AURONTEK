import express from 'express';
import empresaController from '../Controllers/empresa.controller.js';
import { verificarToken, esAdminGeneral } from '../Middleware/auth.middleware.js';

const router = express.Router();

// ✅ Todas las rutas de empresas requieren autenticación y rol Admin General
router.use(verificarToken, esAdminGeneral);

// POST /api/empresas - Crear Empresa
router.post('/', empresaController.crearNuevaEmpresa);

// GET /api/empresas - Listar Empresas
router.get('/', empresaController.listarEmpresas);

// GET /api/empresas/:id - Detalle de Empresa
router.get('/:id', empresaController.detalleEmpresa);

// PUT /api/empresas/:id - Actualizar Empresa
router.put('/:id', empresaController.modificarEmpresa);

// DELETE /api/empresas/:id - Desactivar Empresa
router.delete('/:id', empresaController.eliminarEmpresa);

export default router;
