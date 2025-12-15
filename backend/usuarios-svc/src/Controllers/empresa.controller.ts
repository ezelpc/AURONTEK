import { Request, Response } from 'express';
import empresaService from '../Services/empresa.service';

// POST /api/empresas
const crearNuevaEmpresa = async (req: Request, res: Response) => {
  const {
    nombreEmpresa, rfc, direccion, telefono, correo, // Datos Empresa
    plan, fecha_inicio, // Datos Licencia
    nombreContratante, telefonoContratante, puestoContratante, // Datos Contratante
    nombreAdminInterno, emailAdminInterno, passwordAdminInterno // Datos Admin
  } = req.body;

  if (!nombreEmpresa || !rfc || !correo || !plan || !emailAdminInterno || !passwordAdminInterno) {
    return res.status(400).json({ msg: 'Faltan campos obligatorios.' });
  }

  try {
    const nuevaEmpresa = await empresaService.crearEmpresaLicenciaAdmin(
      { nombre: nombreEmpresa, rfc, direccion, telefono, correo },
      { plan, fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : new Date() },
      { nombre: nombreContratante || nombreAdminInterno, telefono: telefonoContratante, puesto: puestoContratante },
      { nombre: nombreAdminInterno || nombreContratante, email: emailAdminInterno, password: passwordAdminInterno }
    );

    res.status(201).json({
      msg: 'Empresa y Admin Interno creados.',
      empresaId: nuevaEmpresa._id,
      codigo_acceso: nuevaEmpresa.codigo_acceso
    });
  } catch (error: any) {
    console.error('[EMPRESA CONTROLLER] Error creando empresa:', error.message);
    res.status(400).json({ msg: error.message });
  }
};

// GET /api/empresas
const listarEmpresas = async (req: Request, res: Response) => {
  try {
    const empresas = await empresaService.obtenerEmpresas();
    res.json(empresas);
  } catch (error: any) {
    res.status(500).json({ msg: 'Error al listar empresas.' });
  }
};

// GET /api/empresas/:id
const detalleEmpresa = async (req: Request, res: Response) => {
  try {
    const empresa = await empresaService.obtenerEmpresaPorId(req.params.id);
    res.json(empresa);
  } catch (error: any) {
    res.status(404).json({ msg: error.message });
  }
};

// PUT /api/empresas/:id
const modificarEmpresa = async (req: Request, res: Response) => {
  const { hqCode, ...datosActualizados } = req.body;

  try {
    const { id } = req.params;

    // Check if company is Aurontek HQ
    const targetEmpresa = await empresaService.obtenerEmpresaPorId(id);
    if (empresaService.isAurontekHQ(targetEmpresa)) {
      const AURONTEK_HQ_CODE = process.env.AURONTEK_HQ_EDIT_CODE || 'AURONTEK_SECURE_2024';
      if (hqCode !== AURONTEK_HQ_CODE) {
        return res.status(403).json({ msg: 'Código de protección de Aurontek HQ incorrecto.' });
      }
    }

    const empresa = await empresaService.actualizarEmpresa(id, datosActualizados);
    res.json({ msg: 'Empresa actualizada.', empresa });
  } catch (error: any) {
    console.error('[EMPRESA CONTROLLER] Error actualizando empresa:', error.message);
    res.status(404).json({ msg: error.message });
  }
};

// DELETE /api/empresas/:id
const eliminarEmpresa = async (req: Request, res: Response) => {
  const { hqCode } = req.body;

  try {
    console.log('[DELETE EMPRESA] ID:', req.params.id);
    console.log('[DELETE EMPRESA] Body:', req.body);
    // Check if company is Aurontek HQ
    // Check if company is Aurontek HQ
    const empresa = await empresaService.obtenerEmpresaPorId(req.params.id);
    if (empresaService.isAurontekHQ(empresa)) {
      // Explicit protection against admin-subroot
      const solicitanteRol = (req as any).usuario?.rol;
      if (solicitanteRol === 'admin-subroot') {
        return res.status(403).json({ msg: 'Admin Subroot no tiene permisos para eliminar Aurontek HQ.' });
      }

      const AURONTEK_HQ_CODE = process.env.AURONTEK_HQ_EDIT_CODE || 'AURONTEK_SECURE_2024';
      if (hqCode !== AURONTEK_HQ_CODE) {
        return res.status(403).json({ msg: 'Código de protección de Aurontek HQ incorrecto.' });
      }
    }

    await empresaService.eliminarEmpresa(req.params.id);
    res.json({ msg: 'Empresa eliminada correctamente.' });
  } catch (error: any) {
    console.error('[EMPRESA CONTROLLER] Error eliminando empresa:', error.message);
    console.error('[EMPRESA CONTROLLER] Stack:', error.stack);
    res.status(500).json({ msg: error.message || 'Error al eliminar empresa.' });
  }
};

// PATCH /api/empresas/:id/licencia
const toggleLicencia = async (req: Request, res: Response) => {
  const { activo } = req.body;

  try {
    const empresa = await empresaService.toggleLicenciaEmpresa(req.params.id, activo);
    res.json({
      msg: activo ? 'Licencia activada.' : 'Licencia suspendida.',
      empresa
    });
  } catch (error: any) {
    console.error('[EMPRESA CONTROLLER] Error actualizando licencia:', error.message);
    res.status(400).json({ msg: error.message });
  }
};

// POST /api/empresas/:id/regenerar-codigo
const regenerarCodigoAcceso = async (req: Request, res: Response) => {
  try {
    const empresa = await empresaService.obtenerEmpresaPorId(req.params.id);
    const nuevoCodigoAcceso = await empresaService.regenerarCodigoAcceso(req.params.id);

    res.json({
      msg: 'Código de acceso regenerado y notificación enviada.',
      codigo_acceso: nuevoCodigoAcceso
    });
  } catch (error: any) {
    console.error('[EMPRESA CONTROLLER] Error regenerando código:', error.message);
    res.status(400).json({ msg: error.message });
  }
};

// ✅ Exportación por defecto (para usar "import empresaController from ...")
const empresaController = {
  crearNuevaEmpresa,
  listarEmpresas,
  detalleEmpresa,
  modificarEmpresa,
  eliminarEmpresa,
  toggleLicencia,
  regenerarCodigoAcceso
};

export default empresaController;
