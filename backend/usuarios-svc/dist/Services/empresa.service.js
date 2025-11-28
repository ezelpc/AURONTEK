"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.desactivarEmpresa = exports.actualizarEmpresa = exports.encontrarEmpresaPorId = exports.obtenerEmpresaPorId = exports.obtenerEmpresas = exports.crearEmpresaLicenciaAdmin = void 0;
const AltaEmpresas_models_1 = require("../Models/AltaEmpresas.models");
const AltaUsuario_models_1 = __importDefault(require("../Models/AltaUsuario.models"));
const utils_1 = require("../Utils/utils");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Crea Empresa, Licencia, Contratante y Admin Interno
 */
const crearEmpresaLicenciaAdmin = async (datosEmpresa, datosLicencia, datosAdminContratante, datosAdminInterno) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const codigo_acceso = (0, utils_1.generarCodigoAcceso)();
        // Se crea la empresa primero para obtener su _id
        const nuevaEmpresa = new AltaEmpresas_models_1.Empresa({
            ...datosEmpresa,
            codigo_acceso,
            licencia: [datosLicencia],
            contratantes: [{ ...datosAdminContratante, correo: datosAdminInterno.email }],
        });
        // Se crea el admin interno, asociándolo a la empresa
        const adminInterno = new AltaUsuario_models_1.default({
            nombre: datosAdminInterno.nombre,
            correo: datosAdminInterno.email,
            contraseña: datosAdminInterno.password,
            rol: 'admin-interno',
            empresa: nuevaEmpresa._id, // Asignación del ID de la empresa
        });
        // Guardar ambos documentos dentro de la transacción
        await nuevaEmpresa.save({ session });
        await adminInterno.save({ session });
        // Si todo va bien, se confirma la transacción
        await session.commitTransaction();
        return nuevaEmpresa;
    }
    catch (error) {
        // Si algo falla, se aborta la transacción
        await session.abortTransaction();
        if (error.code === 11000) {
            throw new Error('Conflicto: El RFC, correo de empresa o email de admin ya existe.');
        }
        throw error;
    }
    finally {
        // Se cierra la sesión
        session.endSession();
    }
};
exports.crearEmpresaLicenciaAdmin = crearEmpresaLicenciaAdmin;
/**
 * Obtiene todas las empresas (solo Admin General)
 */
const obtenerEmpresas = async () => {
    return await AltaEmpresas_models_1.Empresa.find({}).select('nombre rfc correo telefono activo');
};
exports.obtenerEmpresas = obtenerEmpresas;
/**
 * Obtiene una empresa por su ID
 */
const obtenerEmpresaPorId = async (id) => {
    const empresa = await AltaEmpresas_models_1.Empresa.findById(id);
    if (!empresa)
        throw new Error('Empresa no encontrada.');
    return empresa;
};
exports.obtenerEmpresaPorId = obtenerEmpresaPorId;
/**
 * Encuentra una empresa por su ID (versión segura)
 */
const encontrarEmpresaPorId = async (id) => {
    return await AltaEmpresas_models_1.Empresa.findById(id).select('activo codigo_acceso');
};
exports.encontrarEmpresaPorId = encontrarEmpresaPorId;
/**
 * Actualiza una empresa por su ID (solo Admin General)
 */
const actualizarEmpresa = async (id, datosActualizados) => {
    delete datosActualizados.rfc;
    delete datosActualizados.codigo_acceso;
    const empresa = await AltaEmpresas_models_1.Empresa.findByIdAndUpdate(id, { $set: datosActualizados }, { new: true, runValidators: true });
    if (!empresa)
        throw new Error('Empresa no encontrada.');
    return empresa;
};
exports.actualizarEmpresa = actualizarEmpresa;
/**
 * Desactiva una empresa (borrado lógico)
 */
const desactivarEmpresa = async (id) => {
    const empresa = await AltaEmpresas_models_1.Empresa.findByIdAndUpdate(id, { activo: false, baja: new Date() }, { new: true });
    if (!empresa)
        throw new Error('Empresa no encontrada.');
    return empresa;
};
exports.desactivarEmpresa = desactivarEmpresa;
exports.default = {
    crearEmpresaLicenciaAdmin: exports.crearEmpresaLicenciaAdmin,
    obtenerEmpresas: exports.obtenerEmpresas,
    obtenerEmpresaPorId: exports.obtenerEmpresaPorId,
    encontrarEmpresaPorId: exports.encontrarEmpresaPorId,
    actualizarEmpresa: exports.actualizarEmpresa,
    desactivarEmpresa: exports.desactivarEmpresa,
};
