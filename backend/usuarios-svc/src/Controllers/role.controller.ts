import { Request, Response } from 'express';
import Role from '../Models/Role.model';
import { Empresa } from '../Models/AltaEmpresas.models';
import { PERMISSION_GROUPS } from '../Constants/permissions';

// GET /api/roles
export const listarRoles = async (req: Request, res: Response) => {
    try {
        const { empresaId } = req.query;
        const usuarioRol = req.usuario.rol;
        const usuarioEmpresaId = req.usuario.empresaId;

        let query: any = { activo: true };

        // 1. Admin General/Subroot (Global Visibility)
        if (['admin-general', 'admin-subroot'].includes(usuarioRol)) {
            // Can see all roles.
            // If empresaId query param is provided, filter by it.
            // Also show Global Roles (empresa: null)
            if (empresaId) {
                query = {
                    $or: [
                        { empresa: empresaId },
                        { empresa: null } // Always show global templates if needed? Or just specific.
                    ],
                    activo: true
                };
            }
            // If no empresaId, show ALL roles (Global + All Companies)
        }
        // 2. Admin Interno (Company Scoped)
        else if (usuarioRol === 'admin-interno') {
            if (!usuarioEmpresaId) {
                return res.status(403).json({ msg: 'Usuario sin empresa asignada' });
            }
            // Show only Own Company Roles + Global Roles (if we want them to see base roles)
            // Or just own company roles.
            // Usually internal admins should only manage their own roles.
            // But they might need to assign "common" roles.
            // For management, list only what they can EDIT? Or assign?
            // "generar roles... independientes" implies custom roles.
            query = {
                $or: [
                    { empresa: usuarioEmpresaId },
                    { empresa: null } // Optional: Hide global if they shouldn't edit them.
                ],
                activo: true
            };
        }
        else {
            return res.status(403).json({ msg: 'No autorizado para ver roles' });
        }

        const roles = await Role.find(query)
            .populate('empresa', 'nombre rfc')
            .sort({ creado: -1 });
        res.json(roles);
    } catch (error: any) {
        console.error('Error listing roles:', error);
        res.status(500).json({ msg: 'Error al listar roles' });
    }
};

// POST /api/roles
export const crearRole = async (req: Request, res: Response) => {
    try {
        const { nombre, description, permisos, empresaId } = req.body;
        const usuarioRol = req.usuario.rol;
        const usuarioEmpresaId = req.usuario.empresaId;

        // Validation based on Creator
        let targetEmpresaId = null;

        // Admin General/Subroot
        if (['admin-general', 'admin-subroot'].includes(usuarioRol)) {
            // Can create for any company OR Global (if no empresaId)
            // User requirement: "admin-general y admin-subroot podremos ver todos... en caso de que se requiera un alta... y el admin-interno tenga problemas"
            // So they can specify the target company.

            if (empresaId) {
                targetEmpresaId = empresaId;
            } else {
                // Si no se especifica empresa, y es Super Admin, asignar a Aurontek HQ por defecto
                // en lugar de dejarlo Global (null), si así se desea para roles administrativos internos.
                const hq = await Empresa.findOne({ rfc: 'AURONTEK001' });
                targetEmpresaId = hq ? hq._id : null;
            }
        }
        // Admin Interno
        else if (usuarioRol === 'admin-interno') {
            // Must create for OWN company
            if (!usuarioEmpresaId) return res.status(403).json({ msg: 'Usuario sin empresa' });
            targetEmpresaId = usuarioEmpresaId;
        }
        else {
            return res.status(403).json({ msg: 'No autorizado para crear roles' });
        }

        // Slug generation
        const slug = nombre.toLowerCase().replace(/ /g, '-');

        // Check duplicate
        const existe = await Role.findOne({
            slug,
            empresa: targetEmpresaId
        });

        if (existe) {
            return res.status(400).json({ msg: 'Ya existe un rol con este nombre en la empresa seleccionada.' });
        }

        const nuevoRole = new Role({
            nombre,
            slug,
            descripcion: description,
            empresa: targetEmpresaId,
            permisos,
            nivel: usuarioRol === 'admin-interno' ? 50 : 100, // Defines hierarchy
            creadoPor: req.usuario._id // Assuming ID is available
        });

        await nuevoRole.save();
        res.status(201).json(nuevoRole);

    } catch (error: any) {
        console.error('Error creating role:', error);
        res.status(500).json({ msg: 'Error al crear rol', error: error.message });
    }
};

// PUT /api/roles/:id
export const actualizarRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { nombre, description, permisos } = req.body;
        const usuarioRol = req.usuario.rol;
        const usuarioEmpresaId = req.usuario.empresaId;

        const role = await Role.findById(id);
        if (!role) return res.status(404).json({ msg: 'Rol no encontrado' });

        // --- PROTECCIONES ESTRICTAS POR ROL ---

        // 1. ADMIN GENERAL: INMUTABLE
        if (role.slug === 'admin-general') {
            return res.status(403).json({ msg: 'Los permisos de Admin General NO pueden ser modificados por nadie.' });
        }

        // 2. ADMIN INTERNO: PROTEGIDO (Nadie lo toca, "a excepcion de admin interno" se refiere a que NO se puede cambiar)
        // Interpretación: "a todos los roles se les ppueden cambiar... a excepcion de admin interno" => Admin Interno es inmutable?
        // O "solo admin interno puede cambiarlos"? "a excepcion de admin interno, para esto debe ser algun resolutor externo..."
        // Parece que el usuario quiere decir: "Todos editables, EXCEPTO admin-interno (es fijo)".
        // Si se requiere cambiar admin-interno, debe ser un 'resolutor externo con permisos' (soporte plataforma?) o admin sistema.
        // Asumiremos Protección contra edición para usuarios normales, pero permitida para SUper Admin?
        // User: "a excepcion de admin interno... para esto debe ser algun resolutor externo... o un admin subroot o un admin general"
        // AH! Significa que el Admin Interno NO PUEDE cambiarse a sí mismo, pero los externos/superiores SI pueden.
        // Entonces: Si quien edita es 'admin-interno', NO PUEDE editar su propio rol base.
        if (role.slug === 'admin-interno' && usuarioRol === 'admin-interno') {
            return res.status(403).json({ msg: 'El rol Admin Interno no puede modificarse a sí mismo. Requiere un administrador superior.' });
        }

        // 3. ADMIN SUBROOT: Solo Admin General puede editarlo
        if (role.slug === 'admin-subroot' && usuarioRol !== 'admin-general') {
            return res.status(403).json({ msg: 'Solo el Admin General puede modificar el rol Admin Subroot.' });
        }


        // Scope Check: Can this user edit this role?
        const allowedEditors = ['admin-general', 'admin-subroot', 'resolutor-interno', 'soporte-plataforma']; // Added resolvers if they have permission
        const hasPermission = (req.usuario.permisos || []).includes('roles.manage') || allowedEditors.includes(usuarioRol); // Simplificado

        if (!hasPermission) {
            // Check specifically for admin-interno editing OWN company roles (except admin-interno itself, checked above)
            if (usuarioRol === 'admin-interno' && String(role.empresa) === String(usuarioEmpresaId)) {
                // Allowed
            } else {
                return res.status(403).json({ msg: 'No autorizado para editar este rol' });
            }
        }

        // Update fields
        if (nombre) {
            role.nombre = nombre;
            role.slug = nombre.toLowerCase().replace(/ /g, '-');
        }
        if (description !== undefined) role.descripcion = description;
        if (permisos) role.permisos = permisos;

        await role.save();
        res.json(role);
    } catch (error: any) {
        console.error('Error updating role:', error);
        res.status(500).json({ msg: 'Error al actualizar rol' });
    }
};

// DELETE /api/roles/:id
export const eliminarRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const usuarioRol = req.usuario.rol;
        const usuarioEmpresaId = req.usuario.empresaId;

        const role = await Role.findById(id);
        if (!role) return res.status(404).json({ msg: 'Rol no encontrado' });

        // Authorization
        if (['admin-general', 'admin-subroot'].includes(usuarioRol)) {
            // Allowed
        } else if (usuarioRol === 'admin-interno') {
            if (String(role.empresa) !== String(usuarioEmpresaId)) {
                return res.status(403).json({ msg: 'No autorizado para eliminar este rol' });
            }
        } else {
            return res.status(403).json({ msg: 'No autorizado' });
        }

        // Soft Delete or Hard Delete?
        // Usually Soft Delete is safer, but user might expect removal.
        // Let's do Soft Delete (activo: false) or Hard Delete?
        // If "crud no sirve", they probably expect it gone.
        // Let's do Hard Delete for custom roles, but protect system logic?
        // For now, simple Hard Delete.
        await Role.findByIdAndDelete(id);
        res.json({ msg: 'Rol eliminado correctamente' });

    } catch (error: any) {
        console.error('Error deleting role:', error);
        res.status(500).json({ msg: 'Error al eliminar rol' });
    }
};

// GET /api/permissions
export const listarPermisos = (req: Request, res: Response) => {
    res.json(PERMISSION_GROUPS);
};

export default {
    listarRoles,
    crearRole,
    listarPermisos,
    actualizarRole,
    eliminarRole
};
