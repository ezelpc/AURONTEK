import { Request, Response } from 'express';
import usuarioService from '../Services/usuario.service';

// PATCH /api/usuarios/me/foto-perfil
const subirFotoPerfil = async (req: Request, res: Response) => {
  const userId = req.usuario.id;
  const imageUrl = req.imageUrl;

  if (!imageUrl) {
    return res.status(400).json({ msg: 'No se subió ninguna imagen.' });
  }

  try {
    const usuario = await usuarioService.actualizarFotoPerfil(userId, imageUrl);
    res.json({ msg: 'Foto de perfil actualizada.', fotoPerfil: usuario.fotoPerfil });
  } catch (error: any) {
    res.status(500).json({ msg: error.message });
  }
};

// GET /api/usuarios (Admin Interno - solo su empresa)
const listarUsuarios = async (req: Request, res: Response) => {
  const empresaId = req.usuario.empresaId;
  try {
    const usuarios = await usuarioService.obtenerUsuariosPorEmpresa(empresaId);
    res.json(usuarios);
  } catch (error: any) {
    res.status(500).json({ msg: 'Error al listar usuarios.' });
  }
};

// ✅ NUEVO: GET /api/usuarios - Flexible para servicios y admins
const listarUsuariosFlexible = async (req: Request, res: Response) => {
  try {
    // Si es llamada de servicio
    if (req.isServiceCall) {
      const { empresaId, rol, activo } = req.query;

      const filtros: any = {};
      if (empresaId) filtros.empresa = empresaId;
      if (rol) filtros.rol = rol;
      if (activo !== undefined) filtros.activo = activo === 'true';

      const usuarios = await usuarioService.obtenerUsuariosPorFiltros(filtros);
      return res.json({ usuarios }); // Envolver en objeto para consistencia
    }

    const { empresaId } = req.query;
    const rolUsuario = req.usuario.rol;

    // Admin General y Subroot pueden ver todos o filtrar por empresa
    if (['admin-general', 'admin-subroot'].includes(rolUsuario)) {
      const filtros: any = {};
      if (empresaId) filtros.empresa = empresaId;

      const usuarios = await usuarioService.obtenerUsuariosPorFiltros(filtros);
      return res.json({ usuarios });
    }

    // Admin Interno - Solo su empresa
    if (!req.usuario || !req.usuario.empresaId) {
      return res.status(403).json({ msg: 'Acceso denegado' });
    }

    const usuarios = await usuarioService.obtenerUsuariosPorEmpresa(req.usuario.empresaId);
    res.json({ usuarios }); // Envolver en objeto para consistencia
  } catch (error: any) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ msg: 'Error al listar usuarios.' });
  }
};

import { Empresa } from '../Models/AltaEmpresas.models';

// POST /api/usuarios (Crear usuario)
const crearUsuario = async (req: Request, res: Response) => {
  try {
    const rolUsuario = req.usuario.rol;
    const datosUsuario = req.body;

    // Si es admin-interno, forzar empresa
    if (rolUsuario === 'admin-interno') {
      datosUsuario.empresa = req.usuario.empresaId;
    }

    // Sanitize empresa field (prevent empty string CastError)
    if (datosUsuario.empresa === '') {
      datosUsuario.empresa = undefined;
    }

    // FIX: Si sigue siendo undefined (no se seleccionó empresa) y es un Admin de Sistema (General/Subroot),
    // Asignar por defecto a Aurontek HQ.
    // Esto es necesario porque el Modelo de Usuario REQUIERE una empresa para roles que no sean 'admin-general'.
    // Si creamos un 'Soporte' o 'Usuario' sin empresa, fallará.
    if (!datosUsuario.empresa && ['admin-general', 'admin-subroot'].includes(rolUsuario)) {
      const hq = await Empresa.findOne({ rfc: 'AURONTEK001' });
      if (hq) {
        datosUsuario.empresa = hq._id;
      }
    }

    const nuevoUsuario = await usuarioService.crearUsuario(datosUsuario);
    res.status(201).json(nuevoUsuario);
  } catch (error: any) {
    console.error('Error al crear usuario:', error);
    res.status(400).json({ msg: error.message });
  }
};

// GET /api/usuarios/:id (Admin Interno - solo su empresa)
const detalleUsuario = async (req: Request, res: Response) => {
  const empresaId = req.usuario.empresaId;
  const usuarioId = req.params.id;

  try {
    const usuario = await usuarioService.obtenerUsuarioPorId(usuarioId);

    if (!usuario.empresa || usuario.empresa.toString() !== empresaId) {
      return res.status(403).json({ msg: 'Acceso denegado a este usuario.' });
    }
    res.json(usuario);
  } catch (error: any) {
    res.status(404).json({ msg: error.message });
  }
};

// ✅ NUEVO: GET /api/usuarios/:id - Flexible para servicios y admins
const detalleUsuarioFlexible = async (req: Request, res: Response) => {
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
    if (!req.usuario || !usuario.empresa || usuario.empresa.toString() !== req.usuario.empresaId) {
      return res.status(403).json({ msg: 'Acceso denegado a este usuario.' });
    }

    res.json(usuario);
  } catch (error: any) {
    res.status(404).json({ msg: error.message });
  }
};

// PUT /api/usuarios/:id (Usuario con permisos)
const modificarUsuario = async (req: Request, res: Response) => {
  const empresaId = req.usuario.empresaId;
  const usuarioId = req.params.id;
  const rolUsuario = req.usuario.rol;

  try {
    let usuario = await usuarioService.obtenerUsuarioPorId(usuarioId);

    // Si NO es admin global, validar empresa
    if (!['admin-general', 'admin-subroot'].includes(rolUsuario)) {
      if (!usuario.empresa || usuario.empresa.toString() !== empresaId) {
        return res.status(403).json({ msg: 'Acceso denegado a este usuario.' });
      }
    }

    usuario = await usuarioService.actualizarUsuario(usuarioId, req.body);
    res.json({ msg: 'Usuario actualizado.', usuario });
  } catch (error: any) {
    res.status(400).json({ msg: error.message });
  }
};

// DELETE /api/usuarios/:id (Admin Interno)
const eliminarUsuario = async (req: Request, res: Response) => {
  const empresaId = req.usuario.empresaId;
  const usuarioId = req.params.id;
  const solicitanteRol = req.usuario.rol;

  try {
    const usuario = await usuarioService.obtenerUsuarioPorId(usuarioId);

    // Admin-general y admin-subroot pueden eliminar usuarios de cualquier empresa
    if (!['admin-general', 'admin-subroot'].includes(solicitanteRol)) {
      if (!usuario.empresa || usuario.empresa.toString() !== empresaId) {
        return res.status(403).json({ msg: 'Acceso denegado a este usuario.' });
      }
    }

    const resultado = await usuarioService.eliminarUsuario(usuarioId, solicitanteRol);
    res.json(resultado);
  } catch (error: any) {
    res.status(404).json({ msg: error.message });
  }
};

export default {
  subirFotoPerfil,
  listarUsuarios,
  listarUsuariosFlexible,
  crearUsuario,
  detalleUsuario,
  detalleUsuarioFlexible,
  modificarUsuario,
  eliminarUsuario
};
