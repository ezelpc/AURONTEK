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
    console.log('Verificando existencia de usuario con correo:', datosUsuario.correo);

    const usuarioExistente = await Usuario.findOne({
      correo: datosUsuario.correo.toLowerCase()
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

    // Generar contraseña automáticamente si no se proporciona
    let passwordToUse = datosUsuario.password || datosUsuario.contraseña;
    let passwordGenerada = false;

    if (!passwordToUse) {
      // Generar contraseña segura de 12 caracteres
      const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      passwordToUse = '';
      for (let i = 0; i < 12; i++) {
        passwordToUse += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
      }
      passwordGenerada = true;
      console.log('Contraseña generada automáticamente para:', datosUsuario.correo);
    }

    const datosFormateados = {
      nombre: datosUsuario.nombre,
      correo: datosUsuario.correo.toLowerCase(),
      contraseña: passwordToUse,
      telefono: datosUsuario.telefono,
      puesto: datosUsuario.puesto,
      rol: datosUsuario.rol,
      habilidades: datosUsuario.habilidades || datosUsuario.gruposDeAtencion || [],
      gruposDeAtencion: datosUsuario.gruposDeAtencion || datosUsuario.habilidades || [],
      empresa: datosUsuario.empresa,
      fotoPerfil: datosUsuario.fotoPerfil,
      activo: datosUsuario.activo !== false, // default true
      permisos: datosUsuario.permisos || []
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

<<<<<<< Updated upstream
    // Obtener datos de la empresa (Nombre y Código de Acceso)
    const empresaService = await import('./empresa.service');
    let nombreEmpresa = 'Aurontek';
    let codigoAcceso = 'N/A';

    try {
      if (datosUsuario.empresa) {
        const empresaInfo = await empresaService.default.encontrarEmpresaPorId(datosUsuario.empresa);
        if (empresaInfo) {
          // encontrarEmpresaPorId returns limited fields, let's fetch full to be sure or check what it returns
          // It returns { activo, codigo_acceso }. For name we might need obtenerEmpresaPorId
          const empresaFull = await empresaService.default.obtenerEmpresaPorId(datosUsuario.empresa);
          if (empresaFull) {
            nombreEmpresa = empresaFull.nombre;
            codigoAcceso = empresaFull.codigo_acceso;
          }
        }
      }
    } catch (e) {
      console.warn('No se pudo obtener info de empresa para el correo:', e);
    }

    // Enviar correo de bienvenida
    try {
      const axios = (await import('axios')).default;
      const NOTIF_URL = process.env.NOTIFICACIONES_SERVICE_URL || 'http://notificaciones-svc:3004';
      const FRONTEND_URL = process.env.FRONTEND_URL || 'https://aurontek.vercel.app';

      await axios.post(`${NOTIF_URL}/api/notificaciones/system-email`, {
        to: datosFormateados.correo,
        subject: `Bienvenido a ${nombreEmpresa} - Credenciales de Acceso`,
        text: `Hola ${datosFormateados.nombre},\n\n` +
          `Tu cuenta de usuario ha sido creada exitosamente.\n\n` +
          `Detalles de Acceso:\n` +
          `-------------------\n` +
          `URL: ${FRONTEND_URL}\n` +
          `Empresa: ${nombreEmpresa}\n` +
          `Código de Acceso: ${codigoAcceso}\n` +
          `Correo: ${datosFormateados.correo}\n` +
          `Contraseña: ${datosFormateados.contraseña}\n\n` +
          `Por favor, guarda estas credenciales en un lugar seguro.\n` +
          `Saludos,\nEl equipo de Aurontek.`
      });
      console.log(`Correo de bienvenida enviado a ${datosFormateados.correo}`);
    } catch (emailError) {
      console.error('Error al enviar correo de bienvenida:', emailError);
      // No fallamos la creación del usuario si falla el correo, pero logueamos el error
=======
    // TODO: Enviar correo con contraseña si fue generada automáticamente
    if (passwordGenerada) {
      console.log(`📧 TODO: Enviar correo a ${datosUsuario.correo} con contraseña: ${passwordToUse}`);
      // Aquí se implementará el envío de correo en el futuro
      // await enviarCorreoBienvenida(datosUsuario.correo, datosUsuario.nombre, passwordToUse);
>>>>>>> Stashed changes
    }

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
  const usuario = await Usuario.findById(usuarioId).select('-contraseña').populate('empresa', 'nombre rfc');
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
  const usuario = await Usuario.findById(usuarioId).select('-contraseña').populate('empresa', 'nombre rfc');
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