import * as usuarioService from '../Services/usuario.service.js';

// PATCH /api/usuarios/me/foto-perfil
const subirFotoPerfil = async (req, res) => {
  const userId = req.usuario.id;
  const imageUrl = req.imageUrl;

  if (!imageUrl) {
    return res.status(400).json({ msg: 'No se subió ninguna imagen.' });
  }

  try {
    const usuario = await usuarioService.actualizarFotoPerfil(userId, imageUrl);
    res.json({ msg: 'Foto de perfil actualizada.', fotoPerfil: usuario.fotoPerfil });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// GET /api/usuarios (Admin Interno - solo su empresa)
const listarUsuarios = async (req, res) => {
  const empresaId = req.usuario.empresaId;
  try {
    const usuarios = await usuarioService.obtenerUsuariosPorEmpresa(empresaId);
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ msg: 'Error al listar usuarios.' });
  }
};

// ✅ NUEVO: GET /api/usuarios - Flexible para servicios y admins
const listarUsuariosFlexible = async (req, res) => {
  try {
    // Si es llamada de servicio
    if (req.isServiceCall) {
      const { empresaId, rol, activo } = req.query;
      
      const filtros = {};
      if (empresaId) filtros.empresa = empresaId;
      if (rol) filtros.rol = rol;
      if (activo !== undefined) filtros.activo = activo === 'true';

      const usuarios = await usuarioService.obtenerUsuariosPorFiltros(filtros);
      return res.json(usuarios);
    }

    // Si es usuario normal (admin-interno)
    if (!req.usuario || !req.usuario.empresaId) {
      return res.status(403).json({ msg: 'Acceso denegado' });
    }

    const usuarios = await usuarioService.obtenerUsuariosPorEmpresa(req.usuario.empresaId);
    res.json(usuarios);
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ msg: 'Error al listar usuarios.' });
  }
};

// GET /api/usuarios/:id (Admin Interno - solo su empresa)
const detalleUsuario = async (req, res) => {
  const empresaId = req.usuario.empresaId;
  const usuarioId = req.params.id;

  try {
    const usuario = await usuarioService.obtenerUsuarioPorId(usuarioId);
    
    if (usuario.empresa.toString() !== empresaId) {
      return res.status(403).json({ msg: 'Acceso denegado a este usuario.' });
    }
    res.json(usuario);
  } catch (error) {
    res.status(404).json({ msg: error.message });
  }
};

// ✅ NUEVO: GET /api/usuarios/:id - Flexible para servicios y admins
const detalleUsuarioFlexible = async (req, res) => {
  const usuarioId = req.params.id;

  try {
    const usuario = await usuarioService.obtenerUsuarioPorId(usuarioId);

    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    // Si es llamada de servicio, devolver sin restricciones
    if (req.isServiceCall) {
      return res.json(usuario);
    }

    // Si es usuario normal, verificar que pertenezca a su empresa
    if (!req.usuario || usuario.empresa.toString() !== req.usuario.empresaId) {
      return res.status(403).json({ msg: 'Acceso denegado a este usuario.' });
    }

    res.json(usuario);
  } catch (error) {
    res.status(404).json({ msg: error.message });
  }
};

// PUT /api/usuarios/:id (Admin Interno)
const modificarUsuario = async (req, res) => {
  const empresaId = req.usuario.empresaId;
  const usuarioId = req.params.id;

  try {
    let usuario = await usuarioService.obtenerUsuarioPorId(usuarioId);
    if (usuario.empresa.toString() !== empresaId) {
      return res.status(403).json({ msg: 'Acceso denegado a este usuario.' });
    }

    usuario = await usuarioService.actualizarUsuario(usuarioId, req.body);
    res.json({ msg: 'Usuario actualizado.', usuario });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

// DELETE /api/usuarios/:id (Admin Interno)
const eliminarUsuario = async (req, res) => {
  const empresaId = req.usuario.empresaId;
  const usuarioId = req.params.id;

  try {
    const usuario = await usuarioService.obtenerUsuarioPorId(usuarioId);
    if (usuario.empresa.toString() !== empresaId) {
      return res.status(403).json({ msg: 'Acceso denegado a este usuario.' });
    }

    const resultado = await usuarioService.eliminarUsuario(usuarioId);
    res.json(resultado);
  } catch (error) {
    res.status(404).json({ msg: error.message });
  }
};

export default {
  subirFotoPerfil,
  listarUsuarios,
  listarUsuariosFlexible,
  detalleUsuario,
  detalleUsuarioFlexible,
  modificarUsuario,
  eliminarUsuario
};