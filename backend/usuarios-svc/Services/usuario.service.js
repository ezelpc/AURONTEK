// Services/usuario.service.js
import Usuario from '../Models/AltaUsuario.models.js';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

/**
 * Busca usuario por email (para Login)
 * ✅ CORREGIDO: Ya no busca en colección 'admins' directamente
 */
export const encontrarUsuarioPorCorreo = async (email) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('La conexión a MongoDB no está lista');
    }

    // Buscar en la colección de usuarios (incluye admin-general)
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
export const crearUsuario = async (datosUsuario) => {
  try {
    console.log('Verificando existencia de usuario con correo:', datosUsuario.email);

    const usuarioExistente = await Usuario.findOne({
      correo: datosUsuario.email.toLowerCase()
    });

    if (usuarioExistente) {
      console.log('Usuario existente encontrado:', usuarioExistente._id);
      throw new Error('El correo ya está registrado.');
    }

    const datosFormateados = {
      nombre: datosUsuario.nombre,
      correo: datosUsuario.email.toLowerCase(),
      contraseña: datosUsuario.password,
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
  } catch (error) {
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
export const actualizarFotoPerfil = async (userId, imageUrl) => {
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
export const obtenerUsuariosPorEmpresa = async (empresaId) => {
  return await Usuario.find({ empresa: empresaId }).select('-contraseña');
};

/**
 * Obtiene un usuario específico por ID
 */
export const obtenerUsuarioPorId = async (usuarioId) => {
  const usuario = await Usuario.findById(usuarioId).select('-contraseña');
  if (!usuario) throw new Error('Usuario no encontrado.');
  return usuario;
};

/**
 * Actualiza un usuario (para Admin Interno)
 */
export const actualizarUsuario = async (usuarioId, datosActualizados) => {
  const usuario = await Usuario.findById(usuarioId);
  if (!usuario) throw new Error('Usuario no encontrado.');

  // No permitir actualizar rol ni empresa
  delete datosActualizados.rol;
  delete datosActualizados.empresa;
  delete datosActualizados.contraseña; // La contraseña se actualiza por otro método

  Object.assign(usuario, datosActualizados);

  await usuario.save();

  usuario.contraseña = undefined;
  return usuario;
};

/**
 * Elimina un usuario (para Admin Interno)
 */
export const eliminarUsuario = async (usuarioId) => {
  const usuario = await Usuario.findByIdAndDelete(usuarioId);
  if (!usuario) throw new Error('Usuario no encontrado.');
  return { msg: 'Usuario eliminado exitosamente.' };
};

/**
 * ✅ NUEVO: Buscar usuario por ID (para otros servicios)
 */
export const encontrarUsuarioPorId = async (usuarioId) => {
  const usuario = await Usuario.findById(usuarioId).select('-contraseña');
  return usuario;
};

/**
 * ✅ NUEVO: Obtener usuarios por filtros (para servicios)
 */
export const obtenerUsuariosPorFiltros = async (filtros = {}) => {
  return await Usuario.find(filtros).select('-contraseña');
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