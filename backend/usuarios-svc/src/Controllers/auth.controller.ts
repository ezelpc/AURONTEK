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
    }

    // --- FIN DE LA LÓGICA MODIFICADA ---

    // GENERAR TOKEN Y RESPONDER
    const payload = {
      id: usuarioEncontrado._id,
      rol: rolFinal,
      empresaId: empresaIdFinal,
      esAdminGeneral: esAdminGeneral
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
        esAdminGeneral: esAdminGeneral,
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

  if (!token || !password) {
    return res.status(400).json({ msg: 'El token y la nueva contraseña son requeridos.' });
  }

  try {
    // 1. Verificar el token de reseteo.
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ msg: 'Token inválido o expirado.' });
    }

    // 2. Hashear la nueva contraseña.
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Actualizar la contraseña del usuario.
    const usuario = await Usuario.findByIdAndUpdate(
      decoded.id,
      { contraseña: hashedPassword },
      { new: true }
    );

    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado.' });
    }

    res.json({ msg: 'Contraseña actualizada correctamente.' });

  } catch (error: any) {
    // Si el error es por JWT expirado
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ msg: 'El token de recuperación ha expirado. Por favor, solicita uno nuevo.' });
    }
    console.error('Error al resetear contraseña:', error);
    res.status(500).json({ msg: 'Error al resetear la contraseña.', error: error.message });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req: Request, res: Response) => {
  const { email, codigoAcceso } = req.body;

  if (!email || !codigoAcceso) {
    return res.status(400).json({ msg: 'El correo y el código de acceso son requeridos.' });
  }

  try {
    const empresa = await empresaService.encontrarEmpresaPorCodigo(codigoAcceso);
    if (!empresa) {
      return res.status(404).json({ msg: 'Código de acceso inválido.' });
    }

    const usuario = await Usuario.findOne({ correo: email.toLowerCase(), empresa: empresa._id });
    if (!usuario) {
      // Se devuelve una respuesta genérica para no revelar si un email existe o no.
      return res.json({ msg: 'Si el usuario existe y es elegible, se ha enviado un correo con las instrucciones.' });
    }

    if (usuario.rol === 'admin-interno') {
      return res.status(403).json({ msg: 'La recuperación de contraseña para administradores debe solicitarse a través de un ticket de soporte.' });
    }

    const resetToken = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET!, { expiresIn: '15m' }); // Token válido por 15 minutos
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    console.log(`[INFO] Enlace de recuperación para ${email}: ${resetUrl}`);
    // TODO: Publicar evento a RabbitMQ para que notificaciones-svc envíe el correo con el `resetUrl`.

    res.json({ msg: 'Si el usuario existe y es elegible, se ha enviado un correo con las instrucciones para restablecer la contraseña.' });

  } catch (error: any) {
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
    }

    res.json({
      ok: true,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.correo,
        rol: usuario.rol,
        empresaId: usuario.empresa || null,
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

export default { login, register, logout, check, validarCodigoAcceso, forgotPassword, resetPassword, updateStatus };