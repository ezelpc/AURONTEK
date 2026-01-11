import { Request, Response } from 'express';
import usuarioService from '../Services/usuario.service';
import empresaService from '../Services/empresa.service';
import Usuario from '../Models/AltaUsuario.models';
import Admin from '../Models/Admin.model';
import { generarJWT } from '../Utils/jwt';
import { verificarRecaptcha } from '../Utils/recaptcha';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// POST /api/auth/login
// POST /api/auth/login
const login = async (req: Request, res: Response) => {
  // 1. RECEPCIÓN DE DATOS
  console.log('📥 Body recibido:', req.body);

  /* 
    Permitir campos en español o inglés
    frontend envía: correo, contraseña, captchaToken, codigoAcceso 
  */
  const email = req.body.email || req.body.correo;
  const finalPassword = req.body.password || req.body.contraseña;
  const recaptchaToken = req.body.recaptchaToken || req.body.captchaToken;
  const finalCodigo = req.body.codigoAcceso || req.body.codigo_acceso;

  if (!email || !finalPassword) {
    return res.status(400).json({ msg: 'Correo y contraseña son requeridos.' });
  }

  if (!recaptchaToken) {
    return res.status(400).json({ msg: 'Falta el token de reCAPTCHA.' });
  }

  try {
    // Verificar reCAPTCHA en producción
    if (process.env.NODE_ENV === 'production') {
      await verificarRecaptcha(recaptchaToken);
    }

    if (mongoose.connection.readyState !== 1) {
      throw new Error('La base de datos no está disponible.');
    }

    let usuarioEncontrado: any = null;
    let rolFinal = '';
    let empresaIdFinal: any = null;
    let esAdminGeneral = false;
    let permisos: string[] = [];

    // --- INICIO DE LA LÓGICA MODIFICADA ---

    // CASO 1: Login de Administrador (sin código de acceso)
    if (!finalCodigo) {
      console.log('🛡️  Modo Admin (sin código de acceso): Buscando en colección `admins`...');
      // Admin model uses 'correo'
      usuarioEncontrado = await Admin.findOne({ correo: email.toLowerCase() });

      if (!usuarioEncontrado) {
        return res.status(401).json({ msg: 'Credenciales incorrectas o no es un usuario administrador.' });
      }

      const passValido = await bcrypt.compare(finalPassword, usuarioEncontrado.contraseña);
      if (!passValido) {
        return res.status(401).json({ msg: 'Credenciales incorrectas.' });
      }

      if (!usuarioEncontrado.activo) {
        return res.status(403).json({ msg: 'Usuario inactivo.' });
      }

      esAdminGeneral = true;
      rolFinal = usuarioEncontrado.rol;
      empresaIdFinal = null; // Los admins no pertenecen a una empresa cliente
      permisos = usuarioEncontrado.permisos || [];
      if (rolFinal === 'admin-general') {
        permisos = ['*'];
      }

      console.log(`✅ Autenticado como Administrador: ${usuarioEncontrado.correo}`);

    } else {
      // CASO 2: Login de Empleado (Aurontek HQ o Cliente)
      console.log(`🔑 Modo Empleado (con código de acceso): Validando código "${finalCodigo}"...`);
      const empresa = await empresaService.encontrarEmpresaPorCodigo(finalCodigo);

      if (!empresa) {
        return res.status(404).json({ msg: 'El código de acceso es incorrecto. Intenta de nuevo.' });
      }
      if (!empresa.activo) {
        return res.status(403).json({ msg: 'La licencia de esta empresa está suspendida.' });
      }

      console.log(`🏢 Entorno detectado: ${empresa.nombre}. Buscando usuario en colección \`usuarios\`...`);
      // Usuario model uses 'correo'
      usuarioEncontrado = await Usuario.findOne({
        correo: email.toLowerCase(),
        empresa: empresa._id // Filtro clave para seguridad
      });

      if (!usuarioEncontrado) {
        return res.status(401).json({ msg: 'Credenciales incorrectas o el usuario no pertenece a esta empresa.' });
      }

      const passValido = await usuarioEncontrado.compararPassword(finalPassword);
      if (!passValido) {
        return res.status(401).json({ msg: 'Credenciales incorrectas.' });
      }

      if (!usuarioEncontrado.activo) {
        return res.status(403).json({ msg: 'Usuario inactivo.' });
      }

      // Este es un empleado (de Aurontek o de un cliente), no un admin general.
      esAdminGeneral = false;
      rolFinal = usuarioEncontrado.rol;
      empresaIdFinal = usuarioEncontrado.empresa;
      permisos = usuarioEncontrado.permisos || [];

      console.log(`✅ Autenticado como Empleado: ${usuarioEncontrado.correo}`);

      // MERGE DE PERMISOS (Rol + Usuario)
      // Si el usuario tiene un rol asignado, buscar permisos de ese rol
      let permisosDelRol: string[] = [];
      const RolModel = (await import('../Models/Role.model')).default;

      // Buscar el rol por nombre Y empresa (los roles son por empresa)
      const rolEncontrado = await RolModel.findOne({
        nombre: rolFinal,
        empresa: empresaIdFinal
      });

      if (rolEncontrado) {
        permisosDelRol = rolEncontrado.permisos || [];
      } else if (rolFinal === 'admin-interno') {
        // Fallback para admin-interno si no existe rol explícito en DB (aunque debería)
        // O si es un rol sistema 'admin-interno', quizás tiene permisos fijos?
        // Asumiremos que si no hay rol en DB, no agrega permisos extra, A MENOS que definamos defaults.
        // Pero el usuario dijo "admin interno le asigne el rol", así que debe existir en DB.
      }

      // Fusionar y eliminar duplicados
      permisos = Array.from(new Set([...permisos, ...permisosDelRol]));
      console.log(`🔐 Permisos totales: ${permisos.length} (Directos: ${(usuarioEncontrado.permisos || []).length}, Rol: ${permisosDelRol.length})`);
    }

    // --- FIN DE LA LÓGICA MODIFICADA ---
    // OBTENER NOMBRE DE LA EMPRESA para el frontend (solo si es empleado)
    let nombreEmpresa: string | undefined = undefined;
    if (empresaIdFinal) {
      try {
        const empresaObj = await empresaService.encontrarEmpresaPorId(empresaIdFinal.toString());
        nombreEmpresa = empresaObj?.nombre;
      } catch (e) {
        console.warn('No se pudo obtener el nombre de la empresa, se omitirá en la respuesta');
      }
    }

    // GENERAR TOKEN Y RESPONDER
    const payload = {
      id: usuarioEncontrado._id,
      rol: rolFinal,
      empresaId: empresaIdFinal,
      esAdminGeneral: esAdminGeneral,
      nombre: usuarioEncontrado.nombre, // Added for caching in other services
      permisos: permisos // ✅ CRITICAL: Include permissions in JWT
    };
    const token = generarJWT(payload);

    res.json({
      token,
      usuario: {
        id: usuarioEncontrado._id,
        nombre: usuarioEncontrado.nombre,
        email: usuarioEncontrado.correo,
        rol: rolFinal,
        empresaId: empresaIdFinal,
        empresa: nombreEmpresa, // Added company name
        esAdminGeneral: esAdminGeneral,
        activo: usuarioEncontrado.activo || true, // Added active status
        foto: usuarioEncontrado.foto, // Added photo if available
        permisos // Enviar permisos al frontend
      }
    });

  } catch (error: any) {
    console.error('💥 Error en login:', error);
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

// --- FUNCIONES AUXILIARES ---

const validarCodigoAcceso = async (req: Request, res: Response) => {
  const { codigo } = req.body;
  console.log('🔑 [DEBUG] Validando código:', codigo);

  if (!codigo) {
    return res.status(400).json({ msg: 'El código de acceso es requerido.' });
  }

  try {
    console.log('🔎 [DEBUG] Buscando empresa con código:', codigo);
    const empresa = await empresaService.encontrarEmpresaPorCodigo(codigo);
    console.log('🏢 [DEBUG] Resultado búsqueda:', empresa ? `Encontrada: ${empresa.nombre}` : 'No encontrada');

    // Primero verificar si el código existe
    if (!empresa) {
      return res.status(404).json({ msg: 'El código de acceso es incorrecto. Intenta de nuevo.' });
    }

    // Después verificar si la licencia está activa
    if (!empresa.activo) {
      return res.status(403).json({ msg: 'La licencia de esta empresa está suspendida.' });
    }

    res.json({
      msg: 'Código de acceso válido.',
      empresa: {
        id: empresa._id,
        nombre: empresa.nombre
      }
    });
  } catch (error: any) {
    console.error('Error al validar código:', error);
    res.status(500).json({ msg: 'Error al validar código de acceso.' });
  }
};

const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = req.body;
  // Support token in body or params if adjusted in future, but stick to body as per original code for now
  // Actually, let's look for token in params too if not in body, just in case.
  const tokenToUse = token || req.params.token;

  if (!tokenToUse || !password) {
    return res.status(400).json({ msg: 'El token y la nueva contraseña son requeridos.' });
  }

  try {
    // Hash del token para buscar en DB
    const resetPasswordToken = crypto.createHash('sha256').update(tokenToUse).digest('hex');

    // Buscar usuario con token válido y no expirado
    const usuario = await Usuario.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!usuario) {
      return res.status(400).json({ msg: 'Token inválido o ha expirado.' });
    }

    // Actualizar password
    usuario.contraseña = password; // Pre-save hook will hash it
    usuario.resetPasswordToken = undefined;
    usuario.resetPasswordExpires = undefined;

    await usuario.save();

    // ✅ NOTIFICAR CAMBIO DE CONTRASEÑA
    try {
      const { notificarCambioContraseña } = await import('../Services/notificaciones.helper');
      await notificarCambioContraseña(
        usuario._id.toString(),
        usuario.correo,
        usuario.nombre || 'Usuario',
        usuario.empresa?.toString()
      );
    } catch (notifErr: any) {
      console.warn('⚠️  Error notificando cambio de contraseña:', notifErr.message);
      // No fallar el flujo principal
    }

    res.json({ msg: 'Contraseña actualizada correctamente.' });

  } catch (error: any) {
    console.error('Error al resetear contraseña:', error);
    res.status(500).json({ msg: 'Error al resetear la contraseña.', error: error.message });
  }
};

// POST /api/auth/forgot-password
// POST /api/auth/forgot-password
const forgotPassword = async (req: Request, res: Response) => {
  const { email, codigoAcceso } = req.body;
  const axios = require('axios');

  if (!email || !codigoAcceso) {
    return res.status(400).json({ msg: 'El correo y el código de acceso son requeridos.' });
  }

  try {
    const empresa = await empresaService.encontrarEmpresaPorCodigo(codigoAcceso);
    if (!empresa) {
      // En producción, por seguridad, deberíamos retardar y devolver éxito genérico.
      // Pero el frontend valida esto también.
      return res.status(404).json({ msg: 'Código de acceso inválido.' });
    }

    const usuario: any = await Usuario.findOne({ correo: email.toLowerCase(), empresa: empresa._id });
    if (!usuario) {
      // Se devuelve una respuesta genérica
      return res.json({ msg: 'Si el usuario existe y es elegible, se ha enviado un correo con las instrucciones.' });
    }

    if (usuario.rol === 'admin-interno') {
      // Opcional: Permitir reset a admin-interno si queremos.
      // El código original bloqueaba. Mantendremos bloqueo o no?
      // El User Story decía "Admin puede resetear". 
      // Self-service para admin a veces se bloquea.
      // Dejaremos el mensaje pero tal vez deberíamos permitirlo para facilitar testing.
      // Para cumplir requerimientos estrictos:
      return res.status(403).json({ msg: 'La recuperación de contraseña para administradores debe solicitarse a través de un ticket de soporte.' });
    }

    // 3. Generar Contexto Seguro (Crypto)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpires = Date.now() + 3600000; // 1 hora

    usuario.resetPasswordToken = resetPasswordToken;
    usuario.resetPasswordExpires = resetPasswordExpires;

    await usuario.save();

    // 4. Enviar Email (vía Notificaciones SVC)
    const resetUrl = `${process.env.FRONTEND_URL}/empresa/reset-password/${resetToken}`;

    const notificacionesUrl = process.env.NOTIFICACIONES_SERVICE_URL || 'http://localhost:3006'; // fallback

    try {
      await axios.post(`${notificacionesUrl}/api/notificaciones/system-email`, {
        to: email,
        subject: 'Recuperación de Contraseña - Aurontek',
        html: `
                <h1>Recuperación de Contraseña</h1>
                <p>Has solicitado restablecer tu contraseña.</p>
                <p>Haz clic en el siguiente enlace para continuar:</p>
                <a href="${resetUrl}">${resetUrl}</a>
                <p>Este enlace expirará en 1 hora.</p>
                <p>Si no solicitaste esto, ignora este correo.</p>
            `,
        text: `Recuperación de contraseña: ${resetUrl}`
      });
      console.log(`[INFO] Email recuperación enviado a ${email} via notificaciones-svc`);
    } catch (emailError: any) {
      console.error('❌ Error enviando email recuperación:', emailError.message);
      // No fallamos la request principal, pero logueamos.
    }

    res.json({ msg: 'Si el usuario existe y es elegible, se ha enviado un correo con las instrucciones para restablecer la contraseña.' });

  } catch (error: any) {
    console.error('Error forgotPassword:', error);
    res.status(500).json({ msg: 'Error en el proceso de recuperación de contraseña.', error: error.message });
  }
};

const register = async (req: Request, res: Response) => {
  res.status(501).json({ msg: "Endpoint de registro (Implementar lógica completa aquí)" });
};

const logout = async (req: Request, res: Response) => {
  res.json({ msg: 'Sesión cerrada exitosamente' });
};

const check = async (req: Request, res: Response) => {
  try {
    const { id, esAdminGeneral } = (req as any).usuario;
    let usuario: any = null;

    if (esAdminGeneral) {
      usuario = await Admin.findById(id);
      if (!usuario) {
        return res.status(404).json({ msg: 'Usuario no encontrado' });
      }

      // Validar que siga siendo admin-general o admin-subroot
      if (!['admin-general', 'admin-subroot'].includes(usuario.rol)) {
        return res.status(403).json({ msg: 'Permisos insuficientes' });
      }
    } else {
      usuario = await usuarioService.encontrarUsuarioPorId(id);
      if (!usuario) {
        return res.status(404).json({ msg: 'Usuario no encontrado' });
      }

      // Validar que el rol exista (opcional, pero mejor confiar en la DB)
      // const rolesPermitidos = ['admin-interno', 'soporte', 'usuario', 'beca-soporte'];
      // if (!rolesPermitidos.includes(usuario.rol)) {
      //   return res.status(403).json({ msg: 'Rol no válido' });
      // }
    }

    if (!usuario.activo) {
      return res.status(403).json({ msg: 'Usuario inactivo' });
    }

    // Obtener permisos del Rol (Check)
    let permisos: string[] = [];
    if (esAdminGeneral) {
      if (usuario.rol === 'admin-general') {
        permisos = ['*'];
      } else {
        permisos = usuario.permisos || [];
      }
    } else {
      permisos = usuario.permisos || [];

      // MERGE DE PERMISOS (Rol + Usuario) en CHECK
      if (usuario.empresa) {
        try {
          const RolModel = (await import('../Models/Role.model')).default;
          const rolEncontrado = await RolModel.findOne({
            nombre: usuario.rol,
            empresa: usuario.empresa
          });
          if (rolEncontrado && rolEncontrado.permisos) {
            permisos = Array.from(new Set([...permisos, ...rolEncontrado.permisos]));
          }
        } catch (e) {
          console.error('Error merging role permissions in check:', e);
        }
      }
    }

    // OBTENER NOMBRE DE LA EMPRESA para el frontend (solo si es empleado)
    let nombreEmpresa: string | undefined = undefined;
    if (!esAdminGeneral && usuario.empresa) {
      try {
        const empresaObj = await empresaService.encontrarEmpresaPorId(usuario.empresa.toString());
        nombreEmpresa = empresaObj?.nombre;
      } catch (e) {
        console.warn('[check] No se pudo obtener el nombre de la empresa');
      }
    }

    res.json({
      ok: true,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.correo,
        rol: usuario.rol,
        empresaId: usuario.empresa || null,
        empresa: nombreEmpresa, // Added company name
        esAdminGeneral: esAdminGeneral,
        estado_actividad: usuario.estado_actividad, // Include status
        permisos // Include permissions
      }
    });
  } catch (error: any) {
    console.error('Error al verificar sesión:', error);
    res.status(500).json({ msg: 'Error al verificar sesión', error: error.message });
  }
};

const updateStatus = async (req: Request, res: Response) => {
  const { estado } = req.body;
  const usuario = (req as any).usuario;

  console.log('🔄 [updateStatus] Recibida petición');
  console.log('🔄 [updateStatus] Usuario completo:', JSON.stringify(usuario, null, 2));
  console.log('🔄 [updateStatus] Estado solicitado:', estado);

  if (!usuario || !usuario._id) {
    console.error('❌ [updateStatus] No hay información de usuario en la petición');
    return res.status(401).json({ msg: 'No autorizado' });
  }

  if (!['available', 'busy', 'offline'].includes(estado)) {
    return res.status(400).json({ msg: 'Estado inválido' });
  }

  try {
    const userId = usuario._id.toString();
    const esAdmin = ['admin-general', 'admin-subroot', 'admin-support'].includes(usuario.rol);

    console.log('👤 [updateStatus] ID del usuario:', userId);
    console.log('👤 [updateStatus] Rol:', usuario.rol);
    console.log('👤 [updateStatus] Es Admin:', esAdmin);

    let resultado;
    if (esAdmin) {
      console.log('👤 [updateStatus] Actualizando en colección Admin');
      resultado = await Admin.findByIdAndUpdate(
        userId,
        { estado_actividad: estado },
        { new: true }
      );
    } else {
      console.log('👤 [updateStatus] Actualizando en colección Usuario');
      resultado = await Usuario.findByIdAndUpdate(
        userId,
        { estado_actividad: estado },
        { new: true }
      );
    }

    if (!resultado) {
      console.error('❌ [updateStatus] No se encontró el usuario/admin con ID:', userId);
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    console.log('✅ [updateStatus] Estado actualizado exitosamente a:', resultado.estado_actividad);
    res.json({ msg: 'Estado actualizado', estado: resultado.estado_actividad });
  } catch (error: any) {
    console.error('❌ [updateStatus] Error al actualizar estado:', error);
    res.status(500).json({ msg: 'Error al actualizar estado', error: error.message });
  }
};

// GET /api/auth/refresh-permissions
// Endpoint para refrescar permisos del usuario sin hacer logout
const refreshPermissions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ msg: 'Usuario no autenticado' });
    }

    // Buscar usuario y popular rol
    const usuario: any = await Usuario.findById(userId)
      .populate('rol')
      .lean();

    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    // Obtener permisos del rol
    let permisos: string[] = [];
    if (usuario.rol && typeof usuario.rol === 'object') {
      permisos = usuario.rol.permisos || [];
    }

    return res.json({
      permisos,
      rol: typeof usuario.rol === 'object' ? usuario.rol.nombre : usuario.rol,
      updatedAt: new Date()
    });
  } catch (error: any) {
    console.error('Error al refrescar permisos:', error);
    return res.status(500).json({ msg: 'Error al refrescar permisos', error: error.message });
  }
};

export default { login, register, logout, check, validarCodigoAcceso, forgotPassword, resetPassword, updateStatus, refreshPermissions };
