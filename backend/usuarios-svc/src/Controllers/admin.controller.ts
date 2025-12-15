import { Request, Response } from 'express';
import Admin from '../Models/Admin.model';
import { Empresa } from '../Models/AltaEmpresas.models';
import bcrypt from 'bcrypt';

/**
 * Controlador para gestión de Admins (admin-general y admin-subroot)
 */

// POST /api/admins - Crear admin
export const crearAdmin = async (req: Request, res: Response) => {
    try {
        const { nombre, correo, contraseña, telefono, puesto, rol, empresa } = req.body;

        // Validar campos requeridos
        if (!nombre || !correo || !contraseña || !rol) {
            return res.status(400).json({ msg: 'Faltan campos requeridos' });
        }

        // Validar que el rol sea válido
        if (!['admin-general', 'admin-subroot'].includes(rol)) {
            return res.status(400).json({ msg: 'Rol inválido para Admin' });
        }

        // Validar permisos de creación de roles de admin
        const solicitanteRol = (req as any).usuario?.rol;
        if (rol === 'admin-subroot' && solicitanteRol === 'admin-subroot') {
            return res.status(403).json({ msg: 'Un Admin Subroot no puede crear otros Admins Subroot.' });
        }

        // Verificar si el correo ya existe
        const adminExistente = await Admin.findOne({ correo: correo.toLowerCase() });
        if (adminExistente) {
            return res.status(400).json({ msg: 'El correo ya está registrado' });
        }

        // Si es Admin de Sistema y no tiene empresa, asignar Aurontek HQ (si existe)
        // Si el usuario seleccionó una empresa (empresaId), usar esa.
        let empresaFinal = empresa;
        if (!empresaFinal && ['admin-general', 'admin-subroot'].includes(rol)) {
            const hq = await Empresa.findOne({ rfc: 'AURONTEK001' });
            if (hq) {
                empresaFinal = hq._id;
            }
        }

        // Hash de contraseña
        const salt = await bcrypt.genSalt(10);
        const contraseñaHash = await bcrypt.hash(contraseña, salt);

        // Crear admin
        const nuevoAdmin = new Admin({
            nombre,
            correo: correo.toLowerCase(),
            contraseña: contraseñaHash,
            telefono,
            puesto,
            rol,
            empresa: empresaFinal || undefined, // undefined prevents casting error if empty string passed
            activo: true
        });

        await nuevoAdmin.save();

        // Remover contraseña de la respuesta
        const adminRespuesta: any = nuevoAdmin.toObject();
        delete adminRespuesta.contraseña;

        res.status(201).json(adminRespuesta);
    } catch (error: any) {
        console.error('Error creando admin:', error);
        res.status(500).json({ msg: 'Error al crear admin', error: error.message });
    }
};

// GET /api/admins - Listar admins
export const listarAdmins = async (req: Request, res: Response) => {
    try {
        const admins = await Admin.find().select('-contraseña').populate('empresa', 'nombre');
        res.json(admins);
    } catch (error: any) {
        console.error('Error listando admins:', error);
        res.status(500).json({ msg: 'Error al listar admins', error: error.message });
    }
};

// DELETE /api/admins/:id - Eliminar admin
export const eliminarAdmin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const solicitanteRol = (req as any).usuario?.rol;

        const admin = await Admin.findById(id);
        if (!admin) {
            return res.status(404).json({ msg: 'Admin no encontrado' });
        }

        // Solo admin-general puede eliminar admins
        if (solicitanteRol !== 'admin-general') {
            return res.status(403).json({ msg: 'Solo admin-general puede eliminar administradores' });
        }

        await Admin.findByIdAndDelete(id);
        res.json({ msg: 'Admin eliminado exitosamente' });
    } catch (error: any) {
        console.error('Error eliminando admin:', error);
        res.status(500).json({ msg: 'Error al eliminar admin', error: error.message });
    }
};

export default {
    crearAdmin,
    listarAdmins,
    eliminarAdmin
};
