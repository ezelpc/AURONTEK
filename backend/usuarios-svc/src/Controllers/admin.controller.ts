import { Request, Response } from 'express';
import Admin from '../Models/Admin.model';
import bcrypt from 'bcryptjs';

// GET /api/admins
const listarAdmins = async (req: Request, res: Response) => {
    try {
        // Exclude password from the result
        const admins = await Admin.find({}, '-contraseña').sort({ rol: 1, nombre: 1 });
        res.json(admins);
    } catch (error: any) {
        res.status(500).json({ msg: 'Error al listar administradores', error: error.message });
    }
};

// POST /api/admins
const crearAdmin = async (req: Request, res: Response) => {
    const { nombre, correo, password, rol, puesto, permisos } = req.body;

    if (!nombre || !correo || !password || !rol) {
        return res.status(400).json({ msg: 'Los campos nombre, correo, password y rol son requeridos.' });
    }

    // Prevent creating another root admin
    if (rol === 'admin-general') {
        return res.status(403).json({ msg: 'No se puede crear otro Super Administrador.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const nuevoAdmin = new Admin({
            nombre,
            correo: correo.toLowerCase(),
            contraseña: hashedPassword,
            rol,
            puesto,
            permisos: permisos || [], // Default to empty array if not provided
            activo: true
        });

        await nuevoAdmin.save();

        // Return the new admin without the password
        // Use destructuring to exclude the password safely
        const { contraseña, ...adminResponse } = nuevoAdmin.toObject();

        res.status(201).json(adminResponse);

    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(409).json({ msg: `El correo "${correo}" ya está en uso.` });
        }
        res.status(500).json({ msg: 'Error al crear el administrador', error: error.message });
    }
};

// DELETE /api/admins/:id
const eliminarAdmin = async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminSolicitanteId = req.usuario.id;

    // Self-deletion protection
    if (id === adminSolicitanteId) {
        return res.status(403).json({ msg: 'No puedes eliminar tu propia cuenta de administrador.' });
    }

    try {
        const adminEliminado = await Admin.findByIdAndDelete(id);
        if (!adminEliminado) {
            return res.status(404).json({ msg: 'Administrador no encontrado.' });
        }
        res.json({ msg: 'Administrador eliminado correctamente.' });
    } catch (error: any) {
        res.status(500).json({ msg: 'Error al eliminar el administrador', error: error.message });
    }
};

export default {
    listarAdmins,
    crearAdmin,
    eliminarAdmin
};