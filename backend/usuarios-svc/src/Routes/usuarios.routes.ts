import express from 'express';
import usuarioController from '../Controllers/usuario.controller';
import { verificarToken, esGestorUsuarios } from '../Middleware/auth.middleware';
import { validateUserOrService } from '../Middleware/service.middleware';
import { upload, uploadToCloudinary } from '../Utils/cloudinary';

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

// GET /api/usuarios - Listar usuarios (para servicios con query params o admins)
router.get('/',
  validateUserOrService,
  usuarioController.listarUsuariosFlexible
);

// --- 🔹 Rutas de Gestión (Admin General, Subroot, Interno) ---
// Validar permiso según la acción
import { requirePermission } from '../Middleware/requirePermission';
import { PERMISSIONS } from '../Constants/permissions';

// POST /api/usuarios - Crear usuario
router.post('/', 
  verificarToken, 
  requirePermission(PERMISSIONS.USERS_CREATE), 
  usuarioController.crearUsuario
);

// PUT /api/usuarios/:id - Modificar un usuario
router.put('/:id', 
  verificarToken, 
  requirePermission(PERMISSIONS.USERS_EDIT), 
  usuarioController.modificarUsuario
);

// DELETE /api/usuarios/:id - Eliminar un usuario
router.delete('/:id', 
  verificarToken, 
  requirePermission(PERMISSIONS.USERS_DELETE), 
  usuarioController.eliminarUsuario
);

export default router;