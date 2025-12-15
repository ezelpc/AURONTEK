import express from 'express';
import empresaController from '../Controllers/empresa.controller';
import { verificarToken, esAdminGeneral } from '../Middleware/auth.middleware';

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

// DELETE /api/empresas/:id - Eliminar Empresa
router.delete('/:id', empresaController.eliminarEmpresa);

// PATCH /api/empresas/:id/licencia - Suspender/Activar Licencia
router.patch('/:id/licencia', empresaController.toggleLicencia);

// POST /api/empresas/:id/regenerar-codigo - Regenerar Código de Acceso
router.post('/:id/regenerar-codigo', empresaController.regenerarCodigoAcceso);

export default router;
