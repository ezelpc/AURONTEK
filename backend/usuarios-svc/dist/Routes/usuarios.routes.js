"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const usuario_controller_1 = __importDefault(require("../Controllers/usuario.controller"));
const auth_middleware_1 = require("../Middleware/auth.middleware");
const service_middleware_1 = require("../Middleware/service.middleware");
const cloudinary_1 = require("../Utils/cloudinary");
const router = express_1.default.Router();
// --- 🔹 Ruta para cualquier usuario logueado ---
// PATCH /api/usuarios/me/foto-perfil - Actualizar MI foto de perfil
router.patch('/me/foto-perfil', [auth_middleware_1.verificarToken, cloudinary_1.upload.single('foto'), cloudinary_1.uploadToCloudinary], usuario_controller_1.default.subirFotoPerfil);
// --- 🔹 Rutas accesibles por usuarios o servicios ---
// GET /api/usuarios/:id - Detalle de un usuario (para servicios o admin)
router.get('/:id', service_middleware_1.validateUserOrService, usuario_controller_1.default.detalleUsuarioFlexible);
// GET /api/usuarios - Listar usuarios (para servicios con query params o admin interno)
router.get('/', service_middleware_1.validateUserOrService, usuario_controller_1.default.listarUsuariosFlexible);
// --- 🔹 Rutas solo para Admin Interno ---
router.use(auth_middleware_1.verificarToken, auth_middleware_1.esAdminInterno);
// PUT /api/usuarios/:id - Modificar un usuario de MI empresa
router.put('/:id', usuario_controller_1.default.modificarUsuario);
// DELETE /api/usuarios/:id - Eliminar un usuario de MI empresa
router.delete('/:id', usuario_controller_1.default.eliminarUsuario);
exports.default = router;
