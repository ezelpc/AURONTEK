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
  try {
    const empresa = await empresaService.actualizarEmpresa(req.params.id, req.body);
    res.json({ msg: 'Empresa actualizada.', empresa });
  } catch (error: any) {
    res.status(404).json({ msg: error.message });
  }
};

// DELETE /api/empresas/:id
const eliminarEmpresa = async (req: Request, res: Response) => {
  try {
    await empresaService.desactivarEmpresa(req.params.id);
    res.json({ msg: 'Empresa desactivada (borrado lógico).' });
  } catch (error: any) {
    res.status(404).json({ msg: error.message });
  }
};

// ✅ Exportación por defecto (para usar "import empresaController from ...")
const empresaController = {
  crearNuevaEmpresa,
  listarEmpresas,
  detalleEmpresa,
  modificarEmpresa,
  eliminarEmpresa
};

export default empresaController;
