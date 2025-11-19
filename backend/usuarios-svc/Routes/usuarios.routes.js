import express from 'express';
import usuarioController from '../Controllers/usuario.controller.js';
import { verificarToken, esAdminInterno } from '../Middleware/auth.middleware.js';
import { validateUserOrService } from '../Middleware/service.middleware.js';
import { upload, uploadToCloudinary } from '../Utils/cloudinary.js';

const router = express.Router();

// --- 🔹 Ruta para cualquier usuario logueado ---
// PATCH /api/usuarios/me/foto-perfil - Actualizar MI foto de perfil
router.patch(
  '/me/foto-perfil',
  [verificarToken, upload.single('foto'), uploadToCloudinary],
  usuarioController.subirFotoPerfil
);

// --- 🔹 Rutas accesibles por usuarios o servicios ---
// GET /api/usuarios/:id - Detalle de un usuario (para servicios o admin)
router.get('/:id',
  validateUserOrService,
  usuarioController.detalleUsuarioFlexible
);

// GET /api/usuarios - Listar usuarios (para servicios con query params o admin interno)
router.get('/',
  validateUserOrService,
  usuarioController.listarUsuariosFlexible
);

// --- 🔹 Rutas solo para Admin Interno ---
router.use(verificarToken, esAdminInterno);

// PUT /api/usuarios/:id - Modificar un usuario de MI empresa
router.put('/:id', usuarioController.modificarUsuario);

// DELETE /api/usuarios/:id - Eliminar un usuario de MI empresa
router.delete('/:id', usuarioController.eliminarUsuario);

export default router;