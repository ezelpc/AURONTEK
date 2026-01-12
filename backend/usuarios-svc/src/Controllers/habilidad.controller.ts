import { Request, Response } from 'express';
import Habilidad from '../Models/Habilidad.model'; // Assuming this model exists
import Usuario from '../Models/AltaUsuario.models';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

// GET /api/habilidades
const listarHabilidades = async (req: Request, res: Response) => {
    try {
        const habilidades = await Habilidad.find().sort({ nombre: 1 });
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
    console.log('='.repeat(60));
    console.log('[BULK DEBUG] Request received');
    console.log('[BULK DEBUG] Headers:', JSON.stringify(req.headers, null, 2));
    console.log('[BULK DEBUG] Content-Type:', req.headers['content-type']);
    console.log('[BULK DEBUG] req.file:', req.file);
    console.log('[BULK DEBUG] req.files:', (req as any).files);
    console.log('[BULK DEBUG] req.body:', req.body);
    console.log('='.repeat(60));

    if (!req.file) {
        console.error('[BULK ERROR] No file received!');
        console.error('[BULK ERROR] This usually means:');
        console.error('[BULK ERROR] 1. Multer middleware not running');
        console.error('[BULK ERROR] 2. Field name mismatch (expecting "file")');
        console.error('[BULK ERROR] 3. Content-Type not multipart/form-data');
        return res.status(400).json({
            msg: 'No se subió ningún archivo CSV.',
            debug: {
                contentType: req.headers['content-type'],
                bodyPreview: req.body ? Object.keys(req.body) : 'null',
                headers: Object.keys(req.headers)
            }
        });
    }

    const results: any[] = [];
    const errors: any[] = [];
    let createdCount = 0;
    let updatedCount = 0;

    const stream = Readable.from(req.file.buffer);

    stream
        .pipe(csvParser())
        .on('data', (data) => {
            // console.log('[BULK DEBUG] Row:', data);
            results.push(data);
        })
        .on('end', async () => {
            console.log(`[BULK DEBUG] Finished parsing. Rows found: ${results.length}`);
            try {
                for (const row of results) {
                    // Normalize keys to lowercase to handle case sensitivity issues
                    const normalizedRow: any = {};
                    Object.keys(row).forEach(key => {
                        normalizedRow[key.trim().toLowerCase()] = row[key];
                    });

                    const nombre = normalizedRow['nombre'];
                    const descripcion = normalizedRow['descripcion'] || normalizedRow['descripción'];

                    if (!nombre) {
                        console.warn('[BULK WARNING] Row skipped, missing name:', row);
                        continue;
                    }

                    const existing = await Habilidad.findOne({ nombre });
                    if (existing) {
                        console.log(`[BULK DEBUG] Updating existing ability: ${nombre}`);
                        existing.descripcion = descripcion || existing.descripcion;
                        await existing.save();
                        updatedCount++;
                    } else {
                        console.log(`[BULK DEBUG] Creating new ability: ${nombre}`);
                        await Habilidad.create({ nombre, descripcion, activo: true });
                        createdCount++;
                    }
                }

                console.log('[BULK SUCCESS] Stats:', { created: createdCount, updated: updatedCount });

                res.json({
                    msg: 'Carga masiva completada',
                    stats: {
                        processed: results.length,
                        created: createdCount,
                        updated: updatedCount,
                        errors: errors.length
                    }
                });
            } catch (err: any) {
                console.error('Error processing CSV:', err);
                res.status(500).json({ msg: 'Error al procesar el archivo', error: err.message });
            }
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
