"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerUsuariosPorFiltros = exports.encontrarUsuarioPorId = exports.eliminarUsuario = exports.actualizarUsuario = exports.obtenerUsuarioPorId = exports.obtenerUsuariosPorEmpresa = exports.actualizarFotoPerfil = exports.crearUsuario = exports.encontrarUsuarioPorCorreo = void 0;
const AltaUsuario_models_1 = __importDefault(require("../Models/AltaUsuario.models"));
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Busca usuario por email (para Login)
 */
const encontrarUsuarioPorCorreo = async (email) => {
    try {
        if (mongoose_1.default.connection.readyState !== 1) {
            throw new Error('La conexión a MongoDB no está lista');
        }
        const usuario = await AltaUsuario_models_1.default.findOne({ correo: email.toLowerCase() })
            .select('+contraseña');
        if (!usuario) {
            return null;
        }
        return usuario;
    }
    catch (error) {
        console.error('Error al buscar usuario:', error);
        throw error;
    }
};
exports.encontrarUsuarioPorCorreo = encontrarUsuarioPorCorreo;
/**
 * Crea un nuevo usuario (para Registro de Admin Interno)
 */
const crearUsuario = async (datosUsuario) => {
    try {
        console.log('Verificando existencia de usuario con correo:', datosUsuario.email);
        const usuarioExistente = await AltaUsuario_models_1.default.findOne({
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
        const nuevoUsuario = new AltaUsuario_models_1.default(datosFormateados);
        await nuevoUsuario.save();
        console.log('Usuario creado exitosamente con ID:', nuevoUsuario._id);
        return nuevoUsuario;
    }
    catch (error) {
        console.error('Error al crear usuario:', error);
        if (error.code === 11000) {
            throw new Error('El correo ya está registrado.');
        }
        throw error;
    }
};
exports.crearUsuario = crearUsuario;
/**
 * Actualiza foto de perfil (para cualquier usuario logueado)
 */
const actualizarFotoPerfil = async (userId, imageUrl) => {
    const usuario = await AltaUsuario_models_1.default.findByIdAndUpdate(userId, { fotoPerfil: imageUrl }, { new: true });
    if (!usuario)
        throw new Error('Usuario no encontrado.');
    return usuario;
};
exports.actualizarFotoPerfil = actualizarFotoPerfil;
/**
 * Obtiene todos los usuarios de UNA empresa (para Admin Interno)
 */
const obtenerUsuariosPorEmpresa = async (empresaId) => {
    return await AltaUsuario_models_1.default.find({ empresa: empresaId }).select('-contraseña');
};
exports.obtenerUsuariosPorEmpresa = obtenerUsuariosPorEmpresa;
/**
 * Obtiene un usuario específico por ID
 */
const obtenerUsuarioPorId = async (usuarioId) => {
    const usuario = await AltaUsuario_models_1.default.findById(usuarioId).select('-contraseña');
    if (!usuario)
        throw new Error('Usuario no encontrado.');
    return usuario;
};
exports.obtenerUsuarioPorId = obtenerUsuarioPorId;
/**
 * Actualiza un usuario (para Admin Interno)
 */
const actualizarUsuario = async (usuarioId, datosActualizados) => {
    const usuario = await AltaUsuario_models_1.default.findById(usuarioId);
    if (!usuario)
        throw new Error('Usuario no encontrado.');
    // No permitir actualizar rol ni empresa
    delete datosActualizados.rol;
    delete datosActualizados.empresa;
    delete datosActualizados.contraseña; // La contraseña se actualiza por otro método
    Object.assign(usuario, datosActualizados);
    await usuario.save();
    usuario.contraseña = undefined;
    return usuario;
};
exports.actualizarUsuario = actualizarUsuario;
/**
 * Elimina un usuario (para Admin Interno)
 */
const eliminarUsuario = async (usuarioId) => {
    const usuario = await AltaUsuario_models_1.default.findByIdAndDelete(usuarioId);
    if (!usuario)
        throw new Error('Usuario no encontrado.');
    return { msg: 'Usuario eliminado exitosamente.' };
};
exports.eliminarUsuario = eliminarUsuario;
/**
 * ✅ NUEVO: Buscar usuario por ID (para otros servicios)
 */
const encontrarUsuarioPorId = async (usuarioId) => {
    const usuario = await AltaUsuario_models_1.default.findById(usuarioId).select('-contraseña');
    return usuario;
};
exports.encontrarUsuarioPorId = encontrarUsuarioPorId;
/**
 * ✅ NUEVO: Obtener usuarios por filtros (para servicios)
 */
const obtenerUsuariosPorFiltros = async (filtros = {}) => {
    return await AltaUsuario_models_1.default.find(filtros).select('-contraseña');
};
exports.obtenerUsuariosPorFiltros = obtenerUsuariosPorFiltros;
exports.default = {
    encontrarUsuarioPorCorreo: exports.encontrarUsuarioPorCorreo,
    encontrarUsuarioPorId: exports.encontrarUsuarioPorId,
    crearUsuario: exports.crearUsuario,
    actualizarFotoPerfil: exports.actualizarFotoPerfil,
    obtenerUsuariosPorEmpresa: exports.obtenerUsuariosPorEmpresa,
    obtenerUsuariosPorFiltros: exports.obtenerUsuariosPorFiltros,
    obtenerUsuarioPorId: exports.obtenerUsuarioPorId,
    actualizarUsuario: exports.actualizarUsuario,
    eliminarUsuario: exports.eliminarUsuario
};
