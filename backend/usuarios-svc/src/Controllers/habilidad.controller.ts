import { Request, Response } from 'express';
import Habilidad from '../Models/Habilidad.model'; // Assuming this model exists
import Usuario from '../Models/AltaUsuario.models';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

// GET /api/habilidades
const listarHabilidades = async (req: Request, res: Response) => {
    try {
        const { empresaId } = req.query;
        let query: any = { activo: true };

        if (empresaId) {
            query.$or = [
                { empresa: empresaId },
                { empresa: null },
                { empresa: { $exists: false } }
            ];
        }

        const habilidades = await Habilidad.find(query).sort({ nombre: 1 });
        res.json(habilidades);
    } catch (error: any) {
        res.status(500).json({ msg: 'Error al listar habilidades', error: error.message });
    }
};

// POST /api/habilidades
const crearHabilidad = async (req: Request, res: Response) => {
    const { nombre, descripcion } = req.body;
    if (!nombre) {
        return res.status(400).json({ msg: 'El nombre de la habilidad es requerido.' });
    }
    try {
        const nuevaHabilidad = new Habilidad({ nombre, descripcion });
        await nuevaHabilidad.save();
        res.status(201).json(nuevaHabilidad);
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(409).json({ msg: `La habilidad "${nombre}" ya existe.` });
        }
        res.status(500).json({ msg: 'Error al crear la habilidad', error: error.message });
    }
};

// PUT /api/habilidades/:id
const modificarHabilidad = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    try {
        const habilidadActualizada = await Habilidad.findByIdAndUpdate(id, { nombre, descripcion }, { new: true });
        if (!habilidadActualizada) {
            return res.status(404).json({ msg: 'Habilidad no encontrada.' });
        }
        res.json(habilidadActualizada);
    } catch (error: any) {
        res.status(500).json({ msg: 'Error al modificar la habilidad', error: error.message });
    }
};

// DELETE /api/habilidades/:id
const eliminarHabilidad = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const habilidadEliminada = await Habilidad.findByIdAndDelete(id);
        if (!habilidadEliminada) {
            return res.status(404).json({ msg: 'Habilidad no encontrada.' });
        }
        // Also remove the skill from all users that have it
        await Usuario.updateMany({}, { $pull: { habilidades: habilidadEliminada.nombre } });
        res.json({ msg: 'Habilidad eliminada correctamente.' });
    } catch (error: any) {
        res.status(500).json({ msg: 'Error al eliminar la habilidad', error: error.message });
    }
};

// GET /api/habilidades/template - Descargar plantilla CSV
const downloadTemplate = async (req: Request, res: Response) => {
    try {
        // Datos de ejemplo para la plantilla
        const templateData = [
            {
                nombre: 'Ejemplo: Soporte Técnico',
                descripcion: 'Grupo especializado en soporte técnico de TI'
            },
            {
                nombre: 'Ejemplo: Recursos Humanos',
                descripcion: 'Grupo de atención para temas de RRHH'
            }
        ];

        // Convertir a CSV
        const headers = Object.keys(templateData[0]);
        const csvRows = [
            headers.join(','),
            ...templateData.map(row =>
                headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(',')
            )
        ];
        const csvContent = csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=plantilla_grupos_atencion.csv');
        res.send('\uFEFF' + csvContent); // BOM for Excel UTF-8 recognition
    } catch (error: any) {
        res.status(500).json({ msg: 'Error al generar la plantilla', error: error.message });
    }
};

// POST /api/habilidades/bulk - Carga masiva desde CSV
const bulkUpload = async (req: Request, res: Response) => {
    console.log('[BULK UPLOAD] Starting processing...');

    if (!req.file) {
        return res.status(400).json({ msg: 'No se recibió ningún archivo CSV.' });
    }

    const results: any[] = [];
    const errors: any[] = [];
    let stats = { processed: 0, created: 0, updated: 0, failed: 0 };

    const stream = Readable.from(req.file.buffer);

    stream
        .pipe(csvParser({
            mapHeaders: ({ header }) => header.trim().toLowerCase()
        }))
        .on('data', (data) => results.push(data))
        .on('error', (err) => {
            console.error('[BULK ERROR] Stream error:', err);
            errors.push(`Error parseando CSV: ${err.message}`);
        })
        .on('end', async () => {
            stats.processed = results.length;
            console.log(`[BULK] Rows to process: ${results.length}`);

            for (let i = 0; i < results.length; i++) {
                const row = results[i];
                try {
                    const nombre = row.nombre;
                    const descripcion = row.descripcion || row.descripción;

                    if (!nombre) {
                        errors.push(`Fila ${i + 1}: El nombre es obligatorio.`);
                        stats.failed++;
                        continue;
                    }

                    const existing = await Habilidad.findOne({
                        nombre: { $regex: new RegExp(`^${nombre.trim()}$`, 'i') }
                    });

                    if (existing) {
                        existing.descripcion = descripcion || existing.descripcion;
                        await existing.save();
                        stats.updated++;
                    } else {
                        await Habilidad.create({
                            nombre: nombre.trim(),
                            descripcion: descripcion?.trim() || '',
                            activo: true
                        });
                        stats.created++;
                    }
                } catch (err: any) {
                    console.error(`[BULK ERROR] Row ${i + 1} failed:`, err);
                    errors.push(`Fila ${i + 1} (${row.nombre || 'Sin nombre'}): ${err.message}`);
                    stats.failed++;
                }
            }

            console.log('[BULK SUCCESS] Final stats:', stats);

            res.json({
                msg: stats.failed > 0 ? 'Carga masiva completada con algunos errores' : 'Carga masiva completada con éxito',
                stats,
                errors: errors.slice(0, 10), // Limit errors in response
                totalErrors: errors.length
            });
        });
};

export default {
    listarHabilidades,
    crearHabilidad,
    modificarHabilidad,
    eliminarHabilidad,
    downloadTemplate,
    bulkUpload
};
