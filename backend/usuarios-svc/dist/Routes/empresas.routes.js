"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const empresa_controller_1 = __importDefault(require("../Controllers/empresa.controller"));
const auth_middleware_1 = require("../Middleware/auth.middleware");
const router = express_1.default.Router();
// ✅ Todas las rutas de empresas requieren autenticación y rol Admin General
router.use(auth_middleware_1.verificarToken, auth_middleware_1.esAdminGeneral);
// POST /api/empresas - Crear Empresa
router.post('/', empresa_controller_1.default.crearNuevaEmpresa);
// GET /api/empresas - Listar Empresas
router.get('/', empresa_controller_1.default.listarEmpresas);
// GET /api/empresas/:id - Detalle de Empresa
router.get('/:id', empresa_controller_1.default.detalleEmpresa);
// PUT /api/empresas/:id - Actualizar Empresa
router.put('/:id', empresa_controller_1.default.modificarEmpresa);
// DELETE /api/empresas/:id - Desactivar Empresa
router.delete('/:id', empresa_controller_1.default.eliminarEmpresa);
exports.default = router;
