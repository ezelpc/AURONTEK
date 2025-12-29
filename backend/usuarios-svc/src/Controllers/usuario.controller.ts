import { Request, Response } from 'express';
import usuarioService from '../Services/usuario.service';
import Usuario from '../Models/AltaUsuario.models';
import csv from 'csv-parser';
import { Readable } from 'stream';
import bcrypt from 'bcryptjs';


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
import {
  PERMISOS,
  PERMISOS_LOCALES_ADMIN,
  PERMISOS_SOPORTE_LOCAL,
  PERMISOS_USUARIO_FINAL,
  PERMISOS_SOPORTE_GLOBAL,
  PERMISOS_ROOT
} from '../Constants/permissions';

// Mapeo de Plantillas para la API
const PLANTILLAS: any = {
  'ADMIN_CLIENTE': PERMISOS_LOCALES_ADMIN,
  'SOPORTE_LOCAL': PERMISOS_SOPORTE_LOCAL,
  'USUARIO_FINAL': PERMISOS_USUARIO_FINAL,
  'SOPORTE_GLOBAL': PERMISOS_SOPORTE_GLOBAL
};

// GET /api/usuarios/metadata-permisos
const obtenerMetadataPermisos = async (req: Request, res: Response) => {
  res.json({
    permisos: PERMISOS,
    plantillas: PLANTILLAS
  });
};


// Helper para validar asignación de permisos
const validarAsignacionPermisos = (permisosAsignados: string[], permisosCreador: string[], esRoot: boolean) => {
  if (esRoot) return true; // Root puede todo

  // Verificar que todos los asignados estén en los del creador
  const invalidos = permisosAsignados.filter(p => !permisosCreador.includes(p));
  if (invalidos.length > 0) {
    throw new Error(`No tienes autorización para asignar estos permisos: ${invalidos.join(', ')}`);
  }
  return true;
};

// POST /api/usuarios (Crear usuario)
const crearUsuario = async (req: Request, res: Response) => {
  try {
    const rolUsuario = req.usuario.rol;
    const datosUsuario = req.body;

    // Validar Permisos ("Nadie da lo que no tiene")
    // Obtener permisos del creador desde el token (ya inyectados en middleware auth)
    const permisosCreador = req.usuario.permisos || [];
    const esRoot = req.usuario.esAdminGeneral && req.usuario.rol === 'admin-general';

    if (datosUsuario.permisos && datosUsuario.permisos.length > 0) {
      validarAsignacionPermisos(datosUsuario.permisos, permisosCreador, esRoot);
    }

    // Si es admin-interno, forzar empresa
    if (rolUsuario === 'admin-interno') {
      datosUsuario.empresa = req.usuario.empresaId;
    }

    // LÓGICA DE TEMPLATE (Fase 4)
    if (datosUsuario.template && PLANTILLAS[datosUsuario.template]) {
      // Expandir template a array de permisos
      const permisosTemplate = PLANTILLAS[datosUsuario.template];
      // Si ya traía permisos manuales, combinarlos o sobrescribir?
      // Política: Template sobrescribe o se fusiona. Vamos a fusionar unique.
      const actuales = datosUsuario.permisos || [];
      datosUsuario.permisos = Array.from(new Set([...actuales, ...permisosTemplate]));
    }


    // Sanitize empresa field (prevent empty string CastError)
    if (datosUsuario.empresa === '') {
      datosUsuario.empresa = undefined;
    }

    // FIX: Si sigue siendo undefined (no se seleccionó empresa) y es un Admin de Sistema (General/Subroot),
    // Asignar por defecto a Aurontek HQ.
    if (!datosUsuario.empresa && ['admin-general', 'admin-subroot'].includes(rolUsuario)) {
      const hq = await Empresa.findOne({ rfc: 'AURONTEK001' });
      if (hq) {
        datosUsuario.empresa = hq._id;
      }
    }

    // Verify Role validity for this company context and get permissions
    if (datosUsuario.rol && datosUsuario.rol !== 'admin-general' && datosUsuario.rol !== 'admin-subroot') {
      const RolModel = (await import('../Models/Role.model')).default;
      const targetEmpresa = datosUsuario.empresa || req.usuario.empresaId;

      const roleExists = await RolModel.findOne({
        nombre: datosUsuario.rol,
        $or: [
          { empresa: targetEmpresa },
          { empresa: null }
        ]
      });

      if (!roleExists) {
        if (datosUsuario.rol !== 'admin-interno') {
          throw new Error(`El rol '${datosUsuario.rol}' no es válido para la empresa seleccionada.`);
        }
      } else {
        // Asignar permisos del rol automáticamente si no se proporcionaron
        if (!datosUsuario.permisos || datosUsuario.permisos.length === 0) {
          datosUsuario.permisos = roleExists.permisos || [];
          console.log(`Permisos asignados automáticamente desde rol '${datosUsuario.rol}':`, datosUsuario.permisos);
        }
      }
    } else if (datosUsuario.rol === 'admin-general') {
      // Admin general tiene todos los permisos
      datosUsuario.permisos = ['*'];
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

  // Validar Permisos si se están actualizando
  if (req.body.permisos) {
    try {
      const permisosCreador = req.usuario.permisos || [];
      const esRoot = req.usuario.esAdminGeneral && req.usuario.rol === 'admin-general';
      validarAsignacionPermisos(req.body.permisos, permisosCreador, esRoot);
    } catch (e: any) {
      return res.status(403).json({ msg: e.message });
    }
  }

  try {
    let usuario = await usuarioService.obtenerUsuarioPorId(usuarioId);

    // Protección ROOT: Nadie puede modificar al Root excepto él mismo
    if (usuario.rol === 'admin-general') {
      // Asumiendo que req.usuario.correo no viene en el token, usamos ID o flag esAdminGeneral + check DB.
      // Pero el token tiene ID.
      // Mejor: Si el usuario objetivo es Root, BLOQUEAR.
      // Excepción: El mismo root modificándose.
      const soyRoot = req.usuario.esAdminGeneral && req.usuario.id === usuario._id.toString();
      if (!soyRoot) {
        return res.status(403).json({ msg: 'No se puede modificar al Super Administrador.' });
      }
    }

    // Si NO es admin global, validar empresa
    if (!['admin-general', 'admin-subroot'].includes(rolUsuario)) {
      if (!usuario.empresa || usuario.empresa.toString() !== empresaId) {
        return res.status(403).json({ msg: 'Acceso denegado a este usuario.' });
      }
    }

    // Validar Rol si cambia
    if (req.body.rol) {
      if (req.body.rol !== 'admin-general' && req.body.rol !== 'admin-subroot') {
        const RolModel = (await import('../Models/Role.model')).default;
        // Use existing user company if not changing, or new company if changing
        const targetEmpresa = req.body.empresa || usuario.empresa || empresaId;

        const roleExists = await RolModel.findOne({
          nombre: req.body.rol,
          $or: [
            { empresa: targetEmpresa },
            { empresa: null }
          ]
        });

        if (!roleExists && req.body.rol !== 'admin-interno') {
          return res.status(400).json({ msg: `El rol '${req.body.rol}' no es válido para esta empresa.` });
        }
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

// POST /api/usuarios/:id/recover-password (Admin Local)
const recuperarContrasenaUsuario = async (req: Request, res: Response) => {
  const adminSolicitante = req.usuario;
  const usuarioIdParaRecuperar = req.params.id;

  try {
    // 1. Validar que el admin solicitante tenga el permiso 'users.recover_password_local'
    if (!adminSolicitante.permisos?.includes('users.recover_password_local')) {
      return res.status(403).json({ msg: 'No tienes permisos para realizar esta acción.' });
    }

    // TODO: Implementar la lógica del servicio:
    // - Verificar que el usuario a recuperar pertenece a la misma empresa que el admin.
    // - Generar una contraseña temporal segura y enviarla por correo al usuario.
    res.status(501).json({ msg: 'Funcionalidad de recuperación de contraseña pendiente de implementación.', usuarioId: usuarioIdParaRecuperar });
  } catch (error: any) {
    res.status(500).json({ msg: error.message });
  }
};

// GET /api/usuarios/actions/layout
const descargarLayoutUsuarios = async (req: Request, res: Response) => {
  const headers = 'nombre,correo,password,rol,puesto';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="layout_usuarios.csv"');
  res.status(200).send(headers);
};

// POST /api/usuarios/actions/import
const importarUsuarios = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'No se ha subido ningún archivo CSV.' });
  }

  const admin = req.usuario;
  // Solo los administradores de empresa pueden hacer cargas masivas a su propia empresa.
  const empresaId = admin.empresaId;

  if (!empresaId) {
    return res.status(400).json({ msg: 'Las cargas masivas solo están permitidas para administradores de empresa.' });
  }

  const results: any[] = [];
  const errors: any[] = [];
  let rowCount = 0;

  const stream = Readable.from(req.file.buffer);

  stream
    .pipe(csv())
    .on('data', (data) => {
      rowCount++;
      // Validación básica de la fila
      if (!data.correo || !data.password || !data.nombre) {
        errors.push({ row: rowCount, error: 'Faltan campos requeridos (nombre, correo, password).', data });
      } else {
        results.push(data);
      }
    })
    .on('end', async () => {
      if (errors.length > 0) {
        return res.status(400).json({
          msg: `El archivo CSV contiene ${errors.length} errores. Por favor, corrígelos y vuelve a intentarlo.`,
          errors
        });
      }

      if (results.length === 0) {
        return res.status(400).json({ msg: 'El archivo CSV está vacío o no tiene un formato válido.' });
      }

      try {
        const salt = await bcrypt.genSalt(10);
        const usuariosParaCrear = await Promise.all(results.map(async (user) => ({
          ...user,
          correo: user.correo.toLowerCase(),
          contraseña: await bcrypt.hash(user.password, salt),
          empresa: empresaId, // Asignar la empresa del admin que realiza la carga
          activo: true,
        })));

        const usuariosCreados = await Usuario.insertMany(usuariosParaCrear, { ordered: false });

        res.status(201).json({
          msg: `Importación completada. ${usuariosCreados.length} usuarios creados.`,
        });
      } catch (error: any) {
        if (error.code === 11000) { // Duplicate key error
          return res.status(409).json({ msg: 'Error de duplicados. Uno o más correos electrónicos ya existen en la base de datos.', details: error.writeErrors?.map((e: any) => e.err.errmsg) });
        }
        res.status(500).json({ msg: 'Error al insertar los usuarios en la base de datos.', error: error.message });
      }
    });
};

export default {
  subirFotoPerfil,
  listarUsuarios,
  listarUsuariosFlexible,
  crearUsuario,
  detalleUsuario,
  detalleUsuarioFlexible,
  modificarUsuario,
  eliminarUsuario,
  obtenerMetadataPermisos,
  recuperarContrasenaUsuario,
  descargarLayoutUsuarios,
  importarUsuarios
};
