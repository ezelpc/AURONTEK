import { Request, Response } from 'express';
import usuarioService from '../Services/usuario.service';
import empresaService from '../Services/empresa.service';
import Admin from '../Models/Admin.model';
import { generarJWT } from '../Utils/jwt';
import { verificarRecaptcha } from '../Utils/recaptcha';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// POST /api/auth/login
// POST /api/auth/login
const login = async (req: Request, res: Response) => {
  // 1. RECEPCIÓN DE DATOS
  console.log('📥 Body recibido:', req.body);

  const {
    correo,
    email: emailAlt,
    contraseña,
    password: passwordAlt,
    captchaToken,
    recaptchaToken: recaptchaAlt,
    codigoAcceso,
    codigo_acceso: codigoAccesoAlt
  } = req.body;

  const email = correo || emailAlt;
  const password = contraseña || passwordAlt;
  const recaptchaToken = captchaToken || recaptchaAlt;
  const codigo = codigoAcceso || codigoAccesoAlt;

  // 2. VALIDACIONES BÁSICAS
  if (!email || !password) {
    return res.status(400).json({ msg: 'Correo y contraseña son requeridos.' });
  }

  if (!codigo) {
    return res.status(400).json({ msg: 'El código de acceso es requerido.' });
  }

  if (!recaptchaToken) {
    return res.status(400).json({ msg: 'Falta el token de reCAPTCHA.' });
  }

  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('La base de datos no está disponible.');
    }

    // 3. DETERMINAR ENTORNO POR CÓDIGO DE ACCESO
    console.log('🔑 Validando código de acceso:', codigo);
    const empresa = await empresaService.encontrarEmpresaPorCodigo(codigo);

    if (!empresa) {
      return res.status(404).json({ msg: 'El código de acceso es incorrecto. Intenta de nuevo.' });
    }
    if (!empresa.activo) {
      return res.status(403).json({ msg: 'La licencia de esta empresa está suspendida.' });
    }

    console.log(`🏢 Entorno detectado: ${empresa.nombre} (${empresa.rfc})`);

    let usuarioEncontrado: any = null;
    let rolFinal = '';
    let empresaIdFinal: any = null;
    let esAdminGeneral = false;

    // 4. RUTEO DE AUTENTICACIÓN
    if (empresa.rfc === 'AURONTEK001') {
      // --- ENTORNO: AURONTEK HQ (SUPERSISTEMA) ---
      // SOLO buscar en colección ADMINS
      console.log('🛡️ Modo Super Admin: Buscando en colección Admin...');

      usuarioEncontrado = await Admin.findOne({ correo: email.toLowerCase() });

      if (!usuarioEncontrado) {
        return res.status(400).json({ msg: 'Credenciales inválidas (Admin).' });
      }

      // Validar que sea admin-general o admin-subroot
      if (!['admin-general', 'admin-subroot'].includes(usuarioEncontrado.rol)) {
        return res.status(403).json({ msg: 'Este usuario no tiene permisos de administrador del sistema.' });
      }

      const passValido = await bcrypt.compare(password, usuarioEncontrado.contraseña);
      if (!passValido) {
        return res.status(400).json({ msg: 'Contraseña incorrecta.' });
      }

      esAdminGeneral = true; // Flag para token
      console.log('✅ Autenticado como Super Admin');

    } else {
      // --- ENTORNO: EMPRESA CLIENTE ---
      // SOLO buscar en colección USUARIOS
      console.log('👤 Modo Cliente: Buscando en colección Usuarios...');

      usuarioEncontrado = await usuarioService.encontrarUsuarioPorCorreo(email);

      if (!usuarioEncontrado) {
        return res.status(400).json({ msg: 'Credenciales inválidas.' });
      }

      // Verificar que el usuario pertenezca a la empresa del código
      if (!usuarioEncontrado.empresa || usuarioEncontrado.empresa.toString() !== empresa._id.toString()) {
        return res.status(403).json({ msg: 'El usuario no pertenece a esta empresa.' });
      }

      const passValido = await usuarioEncontrado.compararPassword(password);
      if (!passValido) {
        return res.status(400).json({ msg: 'Contraseña incorrecta.' });
      }

      esAdminGeneral = false;
      console.log('✅ Autenticado como Usuario Cliente');
    }

    // 5. VALIDACIONES COMUNES
    if (!usuarioEncontrado.activo) {
      return res.status(403).json({ msg: 'Usuario inactivo.' });
    }

    rolFinal = usuarioEncontrado.rol;
    empresaIdFinal = esAdminGeneral ? null : usuarioEncontrado.empresa;

    // 6. GENERAR TOKEN
    const payload = {
      id: usuarioEncontrado._id,
      rol: rolFinal,
      empresaId: empresaIdFinal,
      esAdminGeneral: esAdminGeneral
    };

    const token = generarJWT(payload);

    // 7. OBTENER PERMISOS
    let permisos: string[] = [];

    if (esAdminGeneral) {
      // Super Admin tiene acceso total (bypass en frontend/middleware)
      // Pero para la UI enviamos '*' o una lista completa si se prefiere. 
      // La regla de negocio dice: "Bypass". 
      // Enviemos '*' para que el frontend sepa que es SuperAdmin si no usa el flag esAdminGeneral.
      permisos = ['*'];
    } else {
      // Buscar el rol para obtener los permisos actualizados
      // IMPORTANTE: No usar usuarioEncontrado.rol simplemente, si queremos "live" permissions.
      // Pero usuarioEncontrado ya tiene el rol string. 
      // Debemos buscar el Objeto Role.

      try {
        const roleDoc = await import('../Models/Role.model').then(m => m.default.findOne({
          slug: rolFinal,
          $or: [{ empresa: empresaIdFinal }, { empresa: null }]
        }));

        if (roleDoc && roleDoc.permisos) {
          permisos = roleDoc.permisos;
        }
      } catch (err) {
        console.error('Error buscando permisos del rol:', err);
      }
    }

    res.json({
      token,
      usuario: {
        id: usuarioEncontrado._id,
        nombre: usuarioEncontrado.nombre,
        correo: usuarioEncontrado.correo || usuarioEncontrado.email,
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

// POST /api/auth/login-admin (Super Admin Only)
const loginAdmin = async (req: Request, res: Response) => {
  console.log('🛡️ [ADMIN LOGIN] Iniciando sesión de Super Admin...');
  const { correo, contraseña, captchaToken } = req.body;

  if (!correo || !contraseña) {
    return res.status(400).json({ msg: 'Correo y contraseña son requeridos.' });
  }

  if (!captchaToken) {
    return res.status(400).json({ msg: 'Falta el token de reCAPTCHA.' });
  }

  try {
    // 1. Verificar ReCAPTCHA
    await verificarRecaptcha(captchaToken);

    // 2. Buscar en Colección ADMINS
    const admin = await Admin.findOne({ correo: { $regex: new RegExp(`^${correo}$`, 'i') } });

    if (!admin) {
      console.log('❌ Admin no encontrado:', correo);
      return res.status(400).json({ msg: 'Credenciales inválidas.' });
    }

    // 3. Validar Password
    const passValido = await bcrypt.compare(contraseña, admin.contraseña);
    if (!passValido) {
      console.log('❌ Password incorrecto para admin:', correo);
      return res.status(400).json({ msg: 'Credenciales inválidas.' });
    }

    if (!admin.activo) {
      return res.status(403).json({ msg: 'Cuenta desactivada.' });
    }

    console.log('✅ Admin autenticado:', admin.correo);

    // 4. Generar Token
    const token = generarJWT({
      id: admin._id,
      rol: admin.rol, // 'admin-general'
      empresaId: null,
      esAdminGeneral: true
    });

    res.json({
      token,
      usuario: {
        id: admin._id,
        nombre: admin.nombre,
        correo: admin.correo,
        rol: admin.rol
      }
    });

  } catch (error: any) {
    console.error('💥 Error en loginAdmin:', error);
    res.status(500).json({ msg: 'Error interno del servidor', error: error.message });
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
      permisos = ['*'];
    } else if (usuario.rol) {
      const roleDoc = await import('../Models/Role.model').then(m => m.default.findOne({
        slug: usuario.rol,
        $or: [{ empresa: usuario.empresa }, { empresa: null }]
      }));
      if (roleDoc) {
        permisos = roleDoc.permisos || [];
      }
    }

    res.json({
      ok: true,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        correo: usuario.correo || usuario.email,
        rol: usuario.rol,
        empresaId: usuario.empresa || null,
        esAdminGeneral: esAdminGeneral,
        permisos // Include permissions
      }
    });
  } catch (error: any) {
    console.error('Error al verificar sesión:', error);
    res.status(500).json({ msg: 'Error al verificar sesión', error: error.message });
  }
};

export default { login, loginAdmin, register, logout, check, validarCodigoAcceso };