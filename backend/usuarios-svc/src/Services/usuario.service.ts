import Usuario from '../Models/AltaUsuario.models';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

/**
 * Busca usuario por email (para Login)
 */
export const encontrarUsuarioPorCorreo = async (email: string) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('La conexión a MongoDB no está lista');
    }

    const usuario = await Usuario.findOne({ correo: email.toLowerCase() })
      .select('+contraseña');

    if (!usuario) {
      return null;
    }

    return usuario;
  } catch (error) {
    console.error('Error al buscar usuario:', error);
    throw error;
  }
};

/**
 * Crea un nuevo usuario (para Registro de Admin Interno)
 */
export const crearUsuario = async (datosUsuario: any) => {
  try {
    console.log('Verificando existencia de usuario con correo:', datosUsuario.email);

    const usuarioExistente = await Usuario.findOne({
      correo: datosUsuario.email.toLowerCase()
    });

    if (usuarioExistente) {
      console.log('Usuario existente encontrado:', usuarioExistente._id);
      throw new Error('El correo ya está registrado.');
    }

    // Validar que admin-subroot solo se cree en Aurontek HQ
    if (datosUsuario.rol === 'admin-subroot') {
      const empresaService = await import('./empresa.service');
      const empresa = await empresaService.default.obtenerEmpresaPorId(datosUsuario.empresa);

      if (!empresaService.default.isAurontekHQ(empresa)) {
        throw new Error('El rol admin-subroot solo puede ser asignado en Aurontek HQ.');
      }
    }

    const datosFormateados = {
      nombre: datosUsuario.nombre,
      correo: datosUsuario.email.toLowerCase(),
      contraseña: datosUsuario.password,
      telefono: datosUsuario.telefono,
      puesto: datosUsuario.puesto,
      rol: datosUsuario.rol,
      habilidades: datosUsuario.habilidades || [],
      empresa: datosUsuario.empresa,
      activo: datosUsuario.activo !== false // default true
    };

    console.log('Creando usuario con datos:', {
      nombre: datosFormateados.nombre,
      correo: datosFormateados.correo,
      rol: datosFormateados.rol,
      empresa: datosFormateados.empresa
    });

    const nuevoUsuario = new Usuario(datosFormateados);
    await nuevoUsuario.save();

    console.log('Usuario creado exitosamente con ID:', nuevoUsuario._id);
    return nuevoUsuario;
  } catch (error: any) {
    console.error('Error al crear usuario:', error);
    if (error.code === 11000) {
      throw new Error('El correo ya está registrado.');
    }
    throw error;
  }
};

/**
 * Actualiza foto de perfil (para cualquier usuario logueado)
 */
export const actualizarFotoPerfil = async (userId: string, imageUrl: string) => {
  const usuario = await Usuario.findByIdAndUpdate(
    userId,
    { fotoPerfil: imageUrl },
    { new: true }
  );
  if (!usuario) throw new Error('Usuario no encontrado.');
  return usuario;
};

/**
 * Obtiene todos los usuarios de UNA empresa (para Admin Interno)
 */
export const obtenerUsuariosPorEmpresa = async (empresaId: string) => {
  return await Usuario.find({ empresa: empresaId }).select('-contraseña').populate('empresa', 'nombre');
};

/**
 * Obtiene un usuario específico por ID
 */
export const obtenerUsuarioPorId = async (usuarioId: string) => {
  const usuario = await Usuario.findById(usuarioId).select('-contraseña');
  if (!usuario) throw new Error('Usuario no encontrado.');
  return usuario;
};

/**
 * Actualiza un usuario (para Admin Interno)
 */
export const actualizarUsuario = async (usuarioId: string, datosActualizados: any) => {
  const usuario = await Usuario.findById(usuarioId);
  if (!usuario) throw new Error('Usuario no encontrado.');

  // No permitir actualizar rol ni empresa
  delete datosActualizados.rol;
  delete datosActualizados.empresa;
  delete datosActualizados.contraseña; // La contraseña se actualiza por otro método

  Object.assign(usuario, datosActualizados);

  await usuario.save();

  (usuario as any).contraseña = undefined;
  return usuario;
};

/**
 * Elimina un usuario (con validación de jerarquía de roles)
 * @param usuarioId - ID del usuario a eliminar
 * @param solicitanteRol - Rol del usuario que solicita la eliminación
 */
export const eliminarUsuario = async (usuarioId: string, solicitanteRol?: string) => {
  const usuario = await Usuario.findById(usuarioId);
  if (!usuario) throw new Error('Usuario no encontrado.');

  // Validar jerarquía de roles si se proporciona el rol del solicitante
  if (solicitanteRol) {
    // admin-subroot no puede eliminar a otros admin-subroot (solo admin-general puede)
    if (solicitanteRol === 'admin-subroot' && usuario.rol === 'admin-subroot') {
      throw new Error('No tienes permisos para eliminar este usuario.');
    }
  }

  await Usuario.findByIdAndDelete(usuarioId);
  return { msg: 'Usuario eliminado exitosamente.' };
};

/**
 * ✅ NUEVO: Buscar usuario por ID (para otros servicios)
 */
export const encontrarUsuarioPorId = async (usuarioId: string) => {
  const usuario = await Usuario.findById(usuarioId).select('-contraseña');
  return usuario;
};

/**
 * ✅ NUEVO: Obtener usuarios por filtros (para servicios)
 */
export const obtenerUsuariosPorFiltros = async (filtros: any = {}) => {
  return await Usuario.find(filtros).select('-contraseña').populate('empresa', 'nombre');
};

export default {
  encontrarUsuarioPorCorreo,
  encontrarUsuarioPorId,
  crearUsuario,
  actualizarFotoPerfil,
  obtenerUsuariosPorEmpresa,
  obtenerUsuariosPorFiltros,
  obtenerUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario
};