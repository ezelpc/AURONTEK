import usuarioService from '../Services/usuario.service.js';
import empresaService from '../Services/empresa.service.js';
import Admin from '../Models/Admin.model.js';
import { generarJWT } from '../Utils/jwt.js';
import { verificarRecaptcha } from '../Utils/recaptcha.js';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// POST /api/auth/login
const login = async (req, res) => {
  // 1. RECEPCIÓN DE DATOS - Soporte para múltiples formatos
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

  // Mapeo flexible de campos (soporta ambos nombres)
  const email = correo || emailAlt; 
  const password = contraseña || passwordAlt;
  const recaptchaToken = captchaToken || recaptchaAlt;
  const codigo = codigoAcceso || codigoAccesoAlt;

  // 2. VALIDACIONES BÁSICAS
  if (!email || !password) {
    console.error('❌ Faltan credenciales:', { email: !!email, password: !!password });
    return res.status(400).json({ 
      msg: 'Correo y contraseña son requeridos.',
      debug: { receivedEmail: !!email, receivedPassword: !!password }
    });
  }

  if (!recaptchaToken) {
    console.warn('⚠️ Token de reCAPTCHA faltante');
    return res.status(400).json({ msg: 'Falta el token de reCAPTCHA.' });
  }

  // 3. DETERMINAR TIPO DE USUARIO
  const esAdminGeneral = email.toLowerCase().endsWith('@aurontek.com');

  // Si NO es admin general, el código de empresa es obligatorio
  if (!esAdminGeneral && !codigo) {
    console.warn('⚠️ Código de acceso faltante para usuario cliente');
    return res.status(400).json({ msg: 'El código de acceso es requerido.' });
  }

  console.log('🔍 Tipo de login:', esAdminGeneral ? 'Admin General' : 'Usuario Cliente');

  try {
    // --- VERIFICACIÓN DE RECAPTCHA (Opcional en desarrollo) ---
    /*
    const esRecaptchaValido = await verificarRecaptcha(recaptchaToken);
    if (!esRecaptchaValido) {
       return res.status(400).json({ msg: 'La verificación reCAPTCHA falló.' });
    }
    */

    if (mongoose.connection.readyState !== 1) {
      throw new Error('La base de datos no está disponible.');
    }

    let usuarioEncontrado = null;
    let rolFinal = '';
    let empresaIdFinal = null;

    // ============================================================
    // 4. LÓGICA DE BÚSQUEDA SEGÚN TIPO DE USUARIO
    // ============================================================

    if (esAdminGeneral) {
      // CASO A: ADMIN GENERAL (@aurontek.com) -> Buscar en colección 'admins'
      console.log('🔎 Buscando admin general con correo:', email.toLowerCase());
      usuarioEncontrado = await Admin.findOne({ correo: email.toLowerCase() });
      
      if (!usuarioEncontrado) {
         console.error('❌ Admin general no encontrado');
         return res.status(400).json({ msg: 'Credenciales inválidas.' });
      }

      console.log('✅ Admin encontrado:', usuarioEncontrado.nombre, '- Rol:', usuarioEncontrado.rol);

      // Validar que el rol sea admin-general
      if (usuarioEncontrado.rol !== 'admin-general') {
        console.error('❌ Rol incorrecto:', usuarioEncontrado.rol);
        return res.status(403).json({ msg: 'Acceso denegado. No tienes permisos de administrador general.' });
      }

      // Comparar contraseña (Admin usa bcrypt directo)
      const passValido = await bcrypt.compare(password, usuarioEncontrado.contraseña);
      if (!passValido) {
          console.error('❌ Contraseña incorrecta para admin');
          return res.status(400).json({ msg: 'Contraseña incorrecta.' });
      }
      
      if (!usuarioEncontrado.activo) {
          console.error('❌ Admin desactivado');
          return res.status(403).json({ msg: 'Cuenta administrativa desactivada.' });
      }

      console.log('✅ Autenticación de admin exitosa');
      rolFinal = usuarioEncontrado.rol;
      empresaIdFinal = null; // Admin general no pertenece a una empresa cliente

    } else {
      // CASO B: USUARIO CLIENTE -> Buscar en colección 'usuarios'
      console.log('🔎 Buscando usuario cliente con correo:', email);
      usuarioEncontrado = await usuarioService.encontrarUsuarioPorCorreo(email);
      
      if (!usuarioEncontrado) {
         console.error('❌ Usuario cliente no encontrado');
         return res.status(400).json({ msg: 'Credenciales inválidas.' });
      }

      console.log('✅ Usuario encontrado:', usuarioEncontrado.nombre, '- Rol:', usuarioEncontrado.rol);

      // Validar que el rol NO sea admin-general (esos van por la otra ruta)
      if (usuarioEncontrado.rol === 'admin-general') {
        console.error('❌ Usuario con rol admin-general en colección incorrecta');
        return res.status(400).json({ msg: 'Por favor, use su correo @aurontek.com para iniciar sesión.' });
      }

      // Validar que el rol sea válido (admin-interno, soporte, usuario, beca-soporte)
      const rolesPermitidos = ['admin-interno', 'soporte', 'usuario', 'beca-soporte'];
      if (!rolesPermitidos.includes(usuarioEncontrado.rol)) {
        console.error('❌ Rol no válido:', usuarioEncontrado.rol);
        return res.status(403).json({ msg: 'Rol de usuario no válido.' });
      }

      // Usar el método del modelo para comparar contraseña
      const passValido = await usuarioEncontrado.compararPassword(password);
      if (!passValido) {
          console.error('❌ Contraseña incorrecta para usuario');
          return res.status(400).json({ msg: 'Contraseña incorrecta.' });
      }

      if (!usuarioEncontrado.activo) {
          console.error('❌ Usuario inactivo');
          return res.status(403).json({ msg: 'Usuario inactivo.' });
      }

      // Validar Empresa del usuario
      if (!usuarioEncontrado.empresa) {
        console.error('❌ Usuario sin empresa asignada');
        return res.status(400).json({ msg: 'El usuario no tiene empresa asignada.' });
      }

      console.log('🔎 Validando empresa:', usuarioEncontrado.empresa);
      const empresa = await empresaService.encontrarEmpresaPorId(usuarioEncontrado.empresa);
      if (!empresa) {
        console.error('❌ Empresa no encontrada');
        return res.status(404).json({ msg: 'Empresa no encontrada.' });
      }
      
      // Validar código de acceso de la empresa
      console.log('🔑 Validando código de acceso');
      if (empresa.codigo_acceso !== codigo) {
          console.error('❌ Código de acceso incorrecto');
          return res.status(400).json({ msg: 'Código de acceso de la empresa incorrecto.' });
      }

      if (!empresa.activa) {
        console.error('❌ Empresa inactiva');
        return res.status(403).json({ msg: 'La empresa está inactiva.' });
      }

      console.log('✅ Validación de empresa exitosa');
      rolFinal = usuarioEncontrado.rol;
      empresaIdFinal = usuarioEncontrado.empresa;
    }

    // ============================================================
    // 5. GENERAR TOKEN Y RESPONDER
    // ============================================================
    const payload = {
      id: usuarioEncontrado._id,
      rol: rolFinal,
      empresaId: empresaIdFinal,
      esAdminGeneral: esAdminGeneral
    };

    const token = generarJWT(payload);

    console.log('✅ Login exitoso para:', usuarioEncontrado.nombre);

    // Estructura de respuesta simplificada
    res.json({
      token,
      admin: {
        id: usuarioEncontrado._id,
        nombre: usuarioEncontrado.nombre,
        correo: usuarioEncontrado.correo || usuarioEncontrado.email,
        rol: rolFinal
      }
    });

  } catch (error) {
    console.error('💥 Error en login:', error);
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

// --- FUNCIONES AUXILIARES ---

const register = async (req, res) => {
  res.status(501).json({ msg: "Endpoint de registro (Implementar lógica completa aquí)" });
};

const logout = async (req, res) => {
  res.json({ msg: 'Sesión cerrada exitosamente' });
};

const check = async (req, res) => {
  try {
    const { id, esAdminGeneral } = req.usuario;
    let usuario = null;

    if (esAdminGeneral) {
       usuario = await Admin.findById(id);
       if (!usuario) {
         return res.status(404).json({ msg: 'Usuario no encontrado' });
       }
       
       // Validar que siga siendo admin-general
       if (usuario.rol !== 'admin-general') {
         return res.status(403).json({ msg: 'Permisos insuficientes' });
       }
    } else {
       usuario = await usuarioService.encontrarUsuarioPorId(id);
       if (!usuario) {
         return res.status(404).json({ msg: 'Usuario no encontrado' });
       }

       // Validar que el rol sea válido
       const rolesPermitidos = ['admin-interno', 'soporte', 'usuario', 'beca-soporte'];
       if (!rolesPermitidos.includes(usuario.rol)) {
         return res.status(403).json({ msg: 'Rol no válido' });
       }
    }

    if (!usuario.activo) {
      return res.status(403).json({ msg: 'Usuario inactivo' });
    }
    
    res.json({
      ok: true,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        correo: usuario.correo || usuario.email,
        rol: usuario.rol,
        empresaId: usuario.empresa || null,
        esAdminGeneral: esAdminGeneral
      }
    });
  } catch (error) {
    console.error('Error al verificar sesión:', error);
    res.status(500).json({ msg: 'Error al verificar sesión', error: error.message });
  }
};

export default { login, register, logout, check };