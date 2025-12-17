import { Request, Response } from 'express';
import Servicio from '../Models/Servicio.model'; // Asume que el modelo se exporta desde aquí
import mongoose from 'mongoose';
import csv from 'csv-parser';
import { Readable } from 'stream';

/**
 * GET /api/servicios
 * Devuelve el catálogo de servicios visible para un usuario final.
 * Combina servicios globales de Aurontek y servicios locales de la empresa del usuario.
 */
const listarServiciosParaUsuario = async (req: Request, res: Response) => {
    try {
        const empresaId = req.usuario.empresaId;

        if (!empresaId) {
            // Un admin sin empresa no debería ver un catálogo de cliente.
            return res.json({ servicios: [] });
        }

        const query = {
            $or: [
                { alcance: 'global' },
                { alcance: 'local', empresa: new mongoose.Types.ObjectId(empresaId) }
            ],
            activo: true
        };

        const servicios = await Servicio.find(query).sort({ area: 1, nombre: 1 });
        res.json({ servicios });

    } catch (error: any) {
        console.error('Error al listar servicios para usuario:', error);
        res.status(500).json({ msg: 'Error interno del servidor' });
    }
};

/**
 * GET /api/servicios/gestion
 * Devuelve la lista de servicios que un administrador puede gestionar.
 */
const listarServiciosParaGestion = async (req: Request, res: Response) => {
    try {
        const permisos = req.usuario.permisos || [];
        const esRoot = permisos.includes('*');
        const puedeGestionarGlobal = esRoot || permisos.includes('servicios:manage_global');
        const puedeGestionarLocal = esRoot || permisos.includes('servicios:manage_local');

        const queryConditions = [];

        if (puedeGestionarGlobal) {
            queryConditions.push({ alcance: 'global' });
        }
        if (puedeGestionarLocal && req.usuario.empresaId) {
            queryConditions.push({ alcance: 'local', empresa: new mongoose.Types.ObjectId(req.usuario.empresaId) });
        }

        if (queryConditions.length === 0) {
            return res.status(403).json({ msg: 'No tienes permisos para gestionar servicios.' });
        }

        const servicios = await Servicio.find({ $or: queryConditions }).populate('empresa', 'nombre').sort({ alcance: 1, nombre: 1 });
        res.json({ servicios });

    } catch (error: any) {
        console.error('Error al listar servicios para gestión:', error);
        res.status(500).json({ msg: 'Error interno del servidor' });
    }
};

/**
 * POST /api/servicios
 * Crea un nuevo servicio, validando los permisos del administrador.
 */
const crearServicio = async (req: Request, res: Response) => {
    try {
        const datosServicio = req.body;
        const permisos = req.usuario.permisos || [];
        const esRoot = permisos.includes('*');
        const puedeGestionarGlobal = esRoot || permisos.includes('servicios:manage_global');
        const puedeGestionarLocal = esRoot || permisos.includes('servicios:manage_local');

        if (datosServicio.alcance === 'global') {
            if (!puedeGestionarGlobal) {
                return res.status(403).json({ msg: 'No tienes permisos para crear servicios globales.' });
            }
            const hq = await mongoose.model('Empresa').findOne({ tipo: 'sistema' });
            if (!hq) return res.status(500).json({ msg: 'No se encontró la empresa matriz del sistema.' });
            datosServicio.empresa = hq._id;
        } else {
            if (!puedeGestionarLocal) {
                return res.status(403).json({ msg: 'No tienes permisos para crear servicios locales.' });
            }
            datosServicio.alcance = 'local';
            datosServicio.empresa = req.usuario.empresaId;
        }

        const nuevoServicio = new Servicio(datosServicio);
        await nuevoServicio.save();
        res.status(201).json(nuevoServicio);

    } catch (error: any) {
        console.error('Error al crear servicio:', error);
        res.status(400).json({ msg: error.message });
    }
};

/**
 * PUT /api/servicios/:id
 * Modifica un servicio existente.
 */
const modificarServicio = async (req: Request, res: Response) => {
    try {
        const servicioId = req.params.id;
        const datosNuevos = req.body;
        const { permisos, empresaId } = req.usuario;

        const servicio = await Servicio.findById(servicioId);
        if (!servicio) {
            return res.status(404).json({ msg: 'Servicio no encontrado.' });
        }

        const esRoot = permisos.includes('*');
        const puedeGestionarGlobal = esRoot || permisos.includes('servicios:manage_global');
        const puedeGestionarLocal = esRoot || permisos.includes('servicios:manage_local');

        if (servicio.alcance === 'global') {
            if (!puedeGestionarGlobal) {
                return res.status(403).json({ msg: 'No tienes permisos para modificar servicios globales.' });
            }
        } else { // alcance === 'local'
            if (!puedeGestionarLocal) {
                return res.status(403).json({ msg: 'No tienes permisos para modificar servicios locales.' });
            }
            // Además, verificar que el servicio pertenezca a la empresa del admin
            if (servicio.empresa.toString() !== empresaId) {
                 return res.status(403).json({ msg: 'No puedes modificar un servicio que no pertenece a tu empresa.' });
            }
        }

        // Evitar que se cambie el alcance o la empresa de un servicio existente
        delete datosNuevos.alcance;
        delete datosNuevos.empresa;

        const servicioActualizado = await Servicio.findByIdAndUpdate(servicioId, datosNuevos, { new: true });
        res.json(servicioActualizado);

    } catch (error: any) {
        console.error('Error al modificar servicio:', error);
        res.status(400).json({ msg: error.message });
    }
};

/**
 * DELETE /api/servicios/:id
 * Elimina un servicio.
 */
const eliminarServicio = async (req: Request, res: Response) => {
    try {
        const servicioId = req.params.id;
        const { permisos, empresaId } = req.usuario;

        const servicio = await Servicio.findById(servicioId);
        if (!servicio) {
            return res.status(404).json({ msg: 'Servicio no encontrado.' });
        }

        // La lógica de permisos es idéntica a la de modificar, se podría refactorizar a un helper.
        // Por claridad, la mantenemos explícita aquí.
        const esRoot = permisos.includes('*');
        const puedeGestionarGlobal = esRoot || permisos.includes('servicios:manage_global');
        const puedeGestionarLocal = esRoot || permisos.includes('servicios:manage_local');

        if (servicio.alcance === 'global' && !puedeGestionarGlobal) {
            return res.status(403).json({ msg: 'No tienes permisos para eliminar servicios globales.' });
        }

        if (servicio.alcance === 'local' && (!puedeGestionarLocal || servicio.empresa.toString() !== empresaId)) {
            return res.status(403).json({ msg: 'No tienes permisos para eliminar este servicio.' });
        }

        await Servicio.findByIdAndDelete(servicioId);
        res.json({ msg: 'Servicio eliminado correctamente.' });

    } catch (error: any) {
        console.error('Error al eliminar servicio:', error);
        res.status(500).json({ msg: 'Error interno del servidor' });
    }
};

/**
 * GET /api/servicios/actions/layout
 * Descarga la plantilla CSV para la carga masiva de servicios.
 */
const descargarLayoutServicios = async (req: Request, res: Response) => {
    const headers = 'nombre,descripcion,area,tipo,prioridad,alcance'; // 'alcance' es opcional para admin local
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="layout_servicios.csv"');
    res.status(200).send(headers);
};

/**
 * POST /api/servicios/actions/import
 * Importa servicios desde un archivo CSV.
 */
const importarServicios = async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ msg: 'No se ha subido ningún archivo CSV.' });
    }

    const admin = req.usuario;
    const permisos = admin.permisos || [];
    const esRoot = permisos.includes('*');
    const puedeGestionarGlobal = esRoot || permisos.includes('servicios:manage_global');
    const puedeGestionarLocal = esRoot || permisos.includes('servicios:manage_local');

    const results: any[] = [];
    const errors: any[] = [];
    let rowCount = 0;

    const stream = Readable.from(req.file.buffer);

    stream
        .pipe(csv())
        .on('data', (data) => {
            rowCount++;
            if (!data.nombre || !data.area || !data.tipo || !data.prioridad) {
                errors.push({ row: rowCount, error: 'Faltan campos requeridos (nombre, area, tipo, prioridad).', data });
            } else {
                results.push(data);
            }
        })
        .on('end', async () => {
            if (errors.length > 0) {
                return res.status(400).json({
                    msg: `El archivo CSV contiene ${errors.length} errores. Por favor, corrígelos.`,
                    errors
                });
            }

            if (results.length === 0) {
                return res.status(400).json({ msg: 'El archivo CSV está vacío o no tiene un formato válido.' });
            }

            try {
                const hq = await mongoose.model('Empresa').findOne({ tipo: 'sistema' });
                if (!hq) return res.status(500).json({ msg: 'No se encontró la empresa matriz del sistema.' });

                const serviciosParaCrear = results.map(service => {
                    let alcance = service.alcance?.toLowerCase() || 'local';
                    let empresaId;

                    if (alcance === 'global') {
                        if (!puedeGestionarGlobal) {
                            throw new Error(`No tienes permisos para crear servicios globales (fila: ${JSON.stringify(service)})`);
                        }
                        empresaId = hq._id;
                    } else {
                        if (!puedeGestionarLocal) {
                            throw new Error(`No tienes permisos para crear servicios locales (fila: ${JSON.stringify(service)})`);
                        }
                        alcance = 'local';
                        empresaId = admin.empresaId;
                    }

                    return {
                        ...service,
                        alcance,
                        empresa: empresaId,
                        activo: true,
                    };
                });

                const serviciosCreados = await Servicio.insertMany(serviciosParaCrear, { ordered: false });

                res.status(201).json({
                    msg: `Importación completada. ${serviciosCreados.length} servicios creados.`,
                });

            } catch (error: any) {
                if (error.code === 11000) {
                    return res.status(409).json({ msg: 'Error de duplicados. Uno o más servicios ya existen.', details: error.writeErrors?.map((e: any) => e.err.errmsg) });
                }
                res.status(500).json({ msg: 'Error al insertar los servicios en la base de datos.', error: error.message });
            }
        });
};

export default {
    listarServiciosParaUsuario,
    listarServiciosParaGestion,
    crearServicio,
    modificarServicio,
    eliminarServicio,
    descargarLayoutServicios,
    importarServicios
};