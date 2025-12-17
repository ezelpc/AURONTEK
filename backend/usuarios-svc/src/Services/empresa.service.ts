import { Empresa } from '../Models/AltaEmpresas.models';
import Usuario from '../Models/AltaUsuario.models';
import { generarCodigoAcceso } from '../Utils/utils';
import mongoose from 'mongoose';

/**
 * Crea Empresa, Licencia, Contratante y Admin Interno
 */
export const crearEmpresaLicenciaAdmin = async (
  datosEmpresa: any,
  datosLicencia: any,
  datosAdminContratante: any,
  datosAdminInterno: any
) => {
  try {
    const codigo_acceso = generarCodigoAcceso();

    // Se crea la empresa primero para obtener su _id
    const nuevaEmpresa = new Empresa({
      ...datosEmpresa,
      codigo_acceso,
      licencia: [datosLicencia],
      contratantes: [{ ...datosAdminContratante, correo: datosAdminInterno.correo }],
    });

    // Guardar la empresa
    await nuevaEmpresa.save();

    // Se crea el admin interno, asociándolo a la empresa
    const adminInterno = new Usuario({
      nombre: datosAdminInterno.nombre,
      correo: datosAdminInterno.correo,
      contraseña: datosAdminInterno.password,
      rol: 'admin-interno',
      empresa: nuevaEmpresa._id, // Asignación del ID de la empresa
    });

    // Guardar el admin interno
    await adminInterno.save();

    return nuevaEmpresa;
  } catch (error: any) {
    if (error.code === 11000) {
      throw new Error('Conflicto: El RFC, correo de empresa o correo de admin ya existe.');
    }
    throw error;
  }
};

/**
 * Obtiene todas las empresas (solo Admin General)
 */
export const obtenerEmpresas = async () => {
  return await Empresa.find({});
};

/**
 * Obtiene una empresa por su ID
 */
export const obtenerEmpresaPorId = async (id: string) => {
  const empresa = await Empresa.findById(id);
  if (!empresa) throw new Error('Empresa no encontrada.');
  return empresa;
};

/**
 * Encuentra una empresa por su ID (versión segura)
 */
export const encontrarEmpresaPorId = async (id: string) => {
  return await Empresa.findById(id).select('activo codigo_acceso');
};

/**
 * Actualiza una empresa por su ID (solo Admin General)
 */
export const actualizarEmpresa = async (id: string, datosActualizados: any) => {
  delete datosActualizados.rfc;
  // delete datosActualizados.codigo_acceso; // Allow update now

  const original = await Empresa.findById(id);
  if (!original) throw new Error('Empresa no encontrada.');

  const empresa = await Empresa.findByIdAndUpdate(
    id,
    { $set: datosActualizados },
    { new: true, runValidators: true }
  );

  // Check if access code changed
  if (datosActualizados.codigo_acceso && original.codigo_acceso !== datosActualizados.codigo_acceso) {
    // TODO: Emit event or call notification service
    // For now, simple console log simulating notification
    console.log(`[SECURITY ALERT] Access code changed for ${empresa?.nombre}. Notifying ${empresa?.correo}...`);

    // Try to call external notification service via HTTP (Gateway or direct)
    try {
      const axios = (await import('axios')).default;
      const NOTIF_URL = process.env.NOTIFICACIONES_SERVICE_URL || 'http://localhost:3004';

      await axios.post(`${NOTIF_URL}/api/notificaciones/system-email`, {
        to: empresa?.correo,
        subject: 'Alerta de Seguridad: Cambio de Código de Acceso',
        text: `Su código de acceso ha sido actualizado a: ${datosActualizados.codigo_acceso}. Si no reconce esta acción, contacte a soporte.`
      });
      console.log('Security notification sent successfully via Axios.');
    } catch (e) {
      console.error('Error sending security notification:', e);
    }
  }

  return empresa;
};

/**
 * Verifica si una empresa es Aurontek HQ
 */
export const isAurontekHQ = (empresa: any): boolean => {
  return empresa.nombre?.toLowerCase().includes('aurontek') &&
    empresa.nombre?.toLowerCase().includes('hq');
};

/**
 * Elimina una empresa (hard delete - solo para Admin General)
 */
export const eliminarEmpresa = async (id: string) => {
  const empresa = await Empresa.findById(id);
  if (!empresa) throw new Error('Empresa no encontrada.');

  // Delete associated users first
  await Usuario.deleteMany({ empresa: id });

  // Delete the company
  await Empresa.findByIdAndDelete(id);

  return { msg: 'Empresa eliminada correctamente' };
};

/**
 * Suspende o activa la licencia de una empresa
 */
export const toggleLicenciaEmpresa = async (id: string, activo: boolean) => {
  const empresa = await Empresa.findByIdAndUpdate(
    id,
    {
      activo,
      ...(activo ? {} : { baja: new Date() })
    },
    { new: true }
  );
  if (!empresa) throw new Error('Empresa no encontrada.');
  return empresa;
};

/**
 * Regenera el código de acceso de una empresa y notifica al admin-interno
 */
export const regenerarCodigoAcceso = async (id: string) => {
  const empresa = await Empresa.findById(id);
  if (!empresa) throw new Error('Empresa no encontrada.');

  const nuevoCodigoAcceso = generarCodigoAcceso();
  empresa.codigo_acceso = nuevoCodigoAcceso;
  await empresa.save();

  // Find admin-interno for this company
  const adminInterno = await Usuario.findOne({ empresa: id, rol: 'admin-interno' });

  if (adminInterno) {
    // TODO: Send email notification to admin-interno
    console.log(`[SECURITY] New access code for ${empresa.nombre}: ${nuevoCodigoAcceso}`);
    console.log(`[NOTIFICATION] Should send email to ${adminInterno.correo}`);
  }

  return nuevoCodigoAcceso;
};

/**
 * Encuentra una empresa por su código de acceso
 */
export const encontrarEmpresaPorCodigo = async (codigo: string) => {
  return await Empresa.findOne({ codigo_acceso: codigo }).select('nombre _id activo');
};

export default {
  crearEmpresaLicenciaAdmin,
  obtenerEmpresas,
  obtenerEmpresaPorId,
  encontrarEmpresaPorId,
  actualizarEmpresa,
  eliminarEmpresa,
  toggleLicenciaEmpresa,
  encontrarEmpresaPorCodigo,
  regenerarCodigoAcceso,
  isAurontekHQ,
};
