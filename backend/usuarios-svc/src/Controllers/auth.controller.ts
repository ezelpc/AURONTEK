import { Request, Response } from 'express';
import usuarioService from '../Services/usuario.service';
import empresaService from '../Services/empresa.service';
import Admin from '../Models/Admin.model';
import { generarJWT } from '../Utils/jwt';
import { verificarRecaptcha } from '../Utils/recaptcha';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

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

  if (!recaptchaToken) {
    return res.status(400).json({ msg: 'Falta el token de reCAPTCHA.' });
  }

  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('La base de datos no está disponible.');
    }

    let usuarioEncontrado: any = null;
    let rolFinal = '';
    let empresaIdFinal: any = null;
    let esAdminGeneral = false;

    // 3. INTENTAR ENCONTRAR COMO ADMIN GENERAL
    console.log('🔎 Buscando en colección Admin:', email.toLowerCase());
    const adminGeneral = await Admin.findOne({ correo: email.toLowerCase() });

    if (adminGeneral) {
      // --- ES ADMIN GENERAL ---
      console.log('✅ Encontrado como Admin General');
      usuarioEncontrado = adminGeneral;
      esAdminGeneral = true;

      if (usuarioEncontrado.rol !== 'admin-general') {
        return res.status(403).json({ msg: 'Rol incorrecto para Admin General.' });
      }

      // Validar contraseña (Admin usa bcrypt directo)
      const passValido = await bcrypt.compare(password, usuarioEncontrado.contraseña);
      if (!passValido) {
        return res.status(400).json({ msg: 'Contraseña incorrecta.' });
      }

    } else {
      // --- NO ES ADMIN GENERAL, BUSCAR COMO USUARIO CLIENTE ---
      console.log('🔎 Buscando en colección Usuario:', email);
      const usuarioCliente = await usuarioService.encontrarUsuarioPorCorreo(email);

      if (!usuarioCliente) {
        console.log('❌ Usuario no encontrado en colección usuarios');
        return res.status(400).json({ msg: 'Credenciales inválidas.' });
      }

      console.log('✅ Encontrado como Usuario Cliente:', {
        id: usuarioCliente._id,
        rol: usuarioCliente.rol,
        empresa: usuarioCliente.empresa
      });
      usuarioEncontrado = usuarioCliente;
      esAdminGeneral = false;

      // Validar contraseña (Usuario usa método del modelo)
      const passValido = await usuarioEncontrado.compararPassword(password);
      if (!passValido) {
        console.log('❌ Contraseña incorrecta para usuario cliente');
        return res.status(400).json({ msg: 'Contraseña incorrecta.' });
      }

      // 4. VALIDACIÓN DE CÓDIGO DE ACCESO (OBLIGATORIO PARA TODOS LOS CLIENTES)
      console.log('🔑 Validando código de acceso. Recibido:', codigo);

      if (!codigo) {
        console.log('❌ Falta código de acceso');
        return res.status(400).json({ msg: 'El código de acceso es requerido.' });
      }

      if (!usuarioEncontrado.empresa) {
        console.log('❌ Usuario sin empresa asignada');
        return res.status(400).json({ msg: 'El usuario no tiene empresa asignada.' });
      }

      const empresa = await empresaService.encontrarEmpresaPorId(usuarioEncontrado.empresa);
      if (!empresa) {
        console.log('❌ Empresa no encontrada en DB:', usuarioEncontrado.empresa);
        return res.status(404).json({ msg: 'Empresa no encontrada.' });
      }

      console.log('🏢 Empresa encontrada:', {
        id: empresa._id,
        codigoEsperado: empresa.codigo_acceso,
        activo: empresa.activo
      });

      if (empresa.codigo_acceso !== codigo) {
        console.log(`❌ Mismatch código acceso. Recibido: '${codigo}' vs Esperado: '${empresa.codigo_acceso}'`);
        return res.status(400).json({ msg: 'Código de acceso de la empresa incorrecto.' });
      }

      if (!empresa.activo) {
        console.log('❌ Empresa inactiva');
        return res.status(403).json({ msg: 'La empresa está inactiva.' });
      }
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

    res.json({
      token,
      admin: {
        id: usuarioEncontrado._id,
        nombre: usuarioEncontrado.nombre,
        correo: usuarioEncontrado.correo || usuarioEncontrado.email,
        rol: rolFinal
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

    if (!empresa) {
      return res.status(404).json({ msg: 'Código de acceso inválido.' });
    }

    if (!empresa.activo) {
      return res.status(403).json({ msg: 'La empresa está inactiva.' });
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
  } catch (error: any) {
    console.error('Error al verificar sesión:', error);
    res.status(500).json({ msg: 'Error al verificar sesión', error: error.message });
  }
};

export default { login, register, logout, check, validarCodigoAcceso };