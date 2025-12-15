import { Request, Response } from 'express';
import Habilidad from '../Models/Habilidad.model';

// GET /habilidades
export const listarHabilidades = async (req: Request, res: Response) => {
    try {
        const { activo, empresaId } = req.query;
        let query: any = {};

        if (activo !== undefined) query.activo = activo === 'true';

        // Filter by company + Global
        const usuarioRol = req.usuario.rol;
        const usuarioEmpresaId = req.usuario.empresaId;

        if (['admin-general', 'admin-subroot', 'soporte-plataforma'].includes(usuarioRol)) {
            // View All (Global + Any Company if queried)
            if (empresaId) query.$or = [{ empresa: null }, { empresa: empresaId }];
            // If no empresaId, show all or just global? Usually Select lists show Global + Relevant.
        } else {
            // Internal: Global + Own Company
            query.$or = [{ empresa: null }, { empresa: usuarioEmpresaId }];
        }

        const habilidades = await Habilidad.find(query).sort({ nombre: 1 });
        res.json(habilidades);
    } catch (error) {
        res.status(500).json({ msg: 'Error al listar habilidades' });
    }
};

// POST /habilidades
export const crearHabilidad = async (req: Request, res: Response) => {
    try {
        const { nombre, descripcion, empresaId } = req.body;

        // Check permissions
        // Usually admins manage this.

        // Check duplicate
        const existe = await Habilidad.findOne({ nombre, empresa: empresaId || null });
        if (existe) return res.status(400).json({ msg: 'Habilidad ya existe' });

        const nueva = new Habilidad({
            nombre,
            descripcion,
            empresa: empresaId || null
        });

        await nueva.save();
        res.status(201).json(nueva);
    } catch (error) {
        res.status(500).json({ msg: 'Error al crear habilidad' });
    }
};

// PUT /habilidades/:id
export const actualizarHabilidad = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await Habilidad.findByIdAndUpdate(id, req.body);
        res.json({ msg: 'Actualizado' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al actualizar' });
    }
};

// DELETE /habilidades/:id
export const eliminarHabilidad = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await Habilidad.findByIdAndDelete(id);
        res.json({ msg: 'Eliminado' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar' });
    }
};

export default {
    listarHabilidades,
    crearHabilidad,
    actualizarHabilidad,
    eliminarHabilidad
};
