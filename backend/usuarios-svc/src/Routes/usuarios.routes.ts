import express from 'express';
import usuarioController from '../Controllers/usuario.controller';
import { verificarToken, esGestorUsuarios } from '../Middleware/auth.middleware';
import { validateUserOrService } from '../Middleware/service.middleware';
import { upload, uploadToCloudinary } from '../Utils/cloudinary';
import multer from 'multer';

const storage = multer.memoryStorage();
const uploadCsv = multer({ storage });

const router = express.Router();

// --- 🔹 Ruta para cualquier usuario logueado ---
// PATCH /api/usuarios/me/foto-perfil - Actualizar MI foto de perfil
router.patch(
  '/me/foto-perfil',
  [verificarToken, upload.single('foto'), uploadToCloudinary],
  usuarioController.subirFotoPerfil
);

// GET /api/usuarios/metadata-permisos - Devuelve plantillas y permisos (Fase 4 - Handshake)
router.get(
  '/metadata-permisos',
  verificarToken,
  usuarioController.obtenerMetadataPermisos
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
import { PERMISOS } from '../Constants/permissions';


// POST /api/usuarios - Crear usuario
router.post('/',
  verificarToken,
  requirePermission(PERMISOS.USERS_CREATE),
  usuarioController.crearUsuario
);

// PUT /api/usuarios/:id - Modificar un usuario
router.put('/:id',
  verificarToken,
  requirePermission(PERMISOS.USERS_UPDATE), // Updated permission name
  usuarioController.modificarUsuario
);

// DELETE /api/usuarios/:id - Eliminar un usuario
router.delete('/:id',
  verificarToken,
  requirePermission(PERMISOS.USERS_DELETE),
  usuarioController.eliminarUsuario
);

// POST /api/usuarios/:id/recover-password - Restablecer contraseña (Admin Local/Global)
router.post('/:id/recover-password',
  verificarToken,
  usuarioController.recuperarContrasenaUsuario
);

// --- 🔹 Rutas de Carga Masiva ---

// GET /api/usuarios/actions/layout - Descargar plantilla CSV
router.get(
  '/actions/layout', // Using a different path to avoid conflict with /:id
  verificarToken,
  requirePermission(PERMISOS.USUARIOS_EXPORT_LAYOUT),
  usuarioController.descargarLayoutUsuarios
);

// POST /api/usuarios/actions/import - Importar usuarios desde CSV
router.post(
  '/actions/import', // Using a different path to avoid conflict
  verificarToken,
  requirePermission(PERMISOS.USUARIOS_IMPORT),
  uploadCsv.single('file'), // 'file' is the field name in the form-data
  usuarioController.importarUsuarios
);

export default router;