import { Request, Response } from 'express';
import Habilidad from '../Models/Habilidad.model'; // Assuming this model exists
import Usuario from '../Models/AltaUsuario.models';

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

export default {
    listarHabilidades,
    crearHabilidad,
    modificarHabilidad,
    eliminarHabilidad
};