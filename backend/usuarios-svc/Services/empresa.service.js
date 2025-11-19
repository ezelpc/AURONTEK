import { Empresa } from '../Models/AltaEmpresas.models.js';
import Usuario from '../Models/AltaUsuario.models.js';
import { generarCodigoAcceso } from '../Utils/utils.js';
import mongoose from 'mongoose';

/**
 * Crea Empresa, Licencia, Contratante y Admin Interno
 */
export const crearEmpresaLicenciaAdmin = async (
  datosEmpresa,
  datosLicencia,
  datosAdminContratante,
  datosAdminInterno
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const codigo_acceso = generarCodigoAcceso();

    // Se crea la empresa primero para obtener su _id
    const nuevaEmpresa = new Empresa({
      ...datosEmpresa,
      codigo_acceso,
      licencia: [datosLicencia],
      contratantes: [{ ...datosAdminContratante, correo: datosAdminInterno.email }],
    });

    // Se crea el admin interno, asociándolo a la empresa
    const adminInterno = new Usuario({
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
  } catch (error) {
    // Si algo falla, se aborta la transacción
    await session.abortTransaction();
    if (error.code === 11000) {
      throw new Error('Conflicto: El RFC, correo de empresa o email de admin ya existe.');
    }
    throw error;
  } finally {
    // Se cierra la sesión
    session.endSession();
  }
};

/**
 * Obtiene todas las empresas (solo Admin General)
 */
export const obtenerEmpresas = async () => {
  return await Empresa.find({}).select('nombre rfc correo telefono activo');
};

/**
 * Obtiene una empresa por su ID
 */
export const obtenerEmpresaPorId = async (id) => {
  const empresa = await Empresa.findById(id);
  if (!empresa) throw new Error('Empresa no encontrada.');
  return empresa;
};

/**
 * Encuentra una empresa por su ID (versión segura)
 */
export const encontrarEmpresaPorId = async (id) => {
  return await Empresa.findById(id).select('activo codigo_acceso');
};

/**
 * Actualiza una empresa por su ID (solo Admin General)
 */
export const actualizarEmpresa = async (id, datosActualizados) => {
  delete datosActualizados.rfc;
  delete datosActualizados.codigo_acceso;

  const empresa = await Empresa.findByIdAndUpdate(
    id,
    { $set: datosActualizados },
    { new: true, runValidators: true }
  );
  if (!empresa) throw new Error('Empresa no encontrada.');
  return empresa;
};

/**
 * Desactiva una empresa (borrado lógico)
 */
export const desactivarEmpresa = async (id) => {
  const empresa = await Empresa.findByIdAndUpdate(
    id,
    { activo: false, baja: new Date() },
    { new: true }
  );
  if (!empresa) throw new Error('Empresa no encontrada.');
  return empresa;
};

/**
 * Export default opcional (si quieres importarlo como objeto)
 */
export default {
  crearEmpresaLicenciaAdmin,
  obtenerEmpresas,
  obtenerEmpresaPorId,
  encontrarEmpresaPorId,
  actualizarEmpresa,
  desactivarEmpresa,
};
