import express from 'express';
import empresaController from '../Controllers/empresa.controller';
import { verificarToken, tienePermiso } from '../Middleware/auth.middleware';

const router = express.Router();

// ✅ Todas las rutas de empresas requieren autenticación
router.use(verificarToken);

// POST /api/empresas - Crear Empresa
router.post('/', tienePermiso('companies.create'), empresaController.crearNuevaEmpresa);

// GET /api/empresas - Listar Empresas
router.get('/', tienePermiso('companies.view_all'), empresaController.listarEmpresas);

// GET /api/empresas/:id - Detalle de Empresa
router.get('/:id', tienePermiso('companies.view_all'), empresaController.detalleEmpresa);

// PUT /api/empresas/:id - Actualizar Empresa
router.put('/:id', tienePermiso('companies.update'), empresaController.modificarEmpresa);

// DELETE /api/empresas/:id - Eliminar Empresa
router.delete('/:id', tienePermiso('companies.delete'), empresaController.eliminarEmpresa);

// PATCH /api/empresas/:id/licencia - Suspender/Activar Licencia
router.patch('/:id/licencia', tienePermiso('companies.suspend'), empresaController.toggleLicencia);

// POST /api/empresas/:id/regenerar-codigo - Regenerar Código de Acceso
router.post('/:id/regenerar-codigo', tienePermiso('companies.regenerate_access_code'), empresaController.regenerarCodigoAcceso);

export default router;
