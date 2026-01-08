import { Request, Response } from 'express';
import Role from '../Models/Role.model';
import { Empresa } from '../Models/AltaEmpresas.models';
import { PERMISSION_GROUPS } from '../Constants/permissions';

// GET /api/roles
export const listarRoles = async (req: Request, res: Response) => {
    try {
        const { empresaId, scope } = req.query;
        const usuarioEmpresaId = req.usuario.empresaId;

        let query: any = { activo: true };

        // Si el usuario tiene empresaId, mostrar roles de su empresa + roles globales
        if (usuarioEmpresaId) {
            query = {
                $or: [
                    { empresa: usuarioEmpresaId },
                    { empresa: null },
                    { empresa: { $exists: false } }
                ],
                activo: true
            };
        }
        // Si no tiene empresaId (admin global), puede filtrar por empresa o ver todos
        else {
            if (scope === 'internal') {
                // Mostrar solo roles globales/internos
                const hq = await Empresa.findOne({ rfc: 'AURONTEK001' });
                const hqId = hq ? hq._id : null;

                const orConditions: any[] = [
                    { empresa: null },
                    { empresa: { $exists: false } }
                ];

                if (hqId) {
                    orConditions.push({ empresa: hqId });
                }

                query = {
                    $or: orConditions,
                    activo: true
                };
            }
            else if (empresaId) {
                // Filtrar por empresa específica
                query = {
                    $or: [
                        { empresa: empresaId },
                        { empresa: null }
                    ],
                    activo: true
                };
            }
            // Si no hay filtros, mostrar todos los roles
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
        const usuarioEmpresaId = req.usuario.empresaId;

        // Si el usuario tiene empresaId, crear rol para su empresa
        // Si no tiene empresaId (admin global), puede especificar la empresa o dejarla null
        let targetEmpresaId = empresaId || usuarioEmpresaId || null;

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
            nivel: 50, // Default level
            creadoPor: req.usuario._id
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
        const usuarioEmpresaId = req.usuario.empresaId;

        const role = await Role.findById(id);
        if (!role) return res.status(404).json({ msg: 'Rol no encontrado' });

        // Protección de roles del sistema (inmutables)
        const systemRoles = ['admin-general', 'admin-subroot', 'admin-interno', 'administrador-interno'];
        if (systemRoles.includes(role.slug)) {
            return res.status(403).json({ msg: 'Los roles del sistema no pueden ser modificados.' });
        }

        // Verificar scope: solo puede editar roles de su propia empresa
        if (usuarioEmpresaId && String(role.empresa) !== String(usuarioEmpresaId)) {
            return res.status(403).json({ msg: 'No autorizado para editar este rol' });
        }

        // Guardar valores originales para la sincronización
        const originalName = role.nombre;
        const originalSlug = role.slug;

        // Update fields
        if (nombre) {
            role.nombre = nombre;
            role.slug = nombre.toLowerCase().replace(/ /g, '-');
        }
        if (description !== undefined) role.descripcion = description;
        if (permisos) role.permisos = permisos;

        await role.save();

        // ♻️ Sincronizar cambios en usuarios
        try {
            const UsuarioModel = (await import('../Models/AltaUsuario.models')).default;

            console.log(`♻️ Iniciando sincronización de roles. Original: '${originalName}', Nuevo: '${role.nombre}'`);

            // Use regex for case-insensitive matching to be robust against "Administrador interno" vs "Administrador Interno"
            const escapeRegex = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

            const identifiers = [originalName, originalSlug, role.nombre, role.slug]
                .filter(Boolean)
                .map(id => new RegExp(`^${escapeRegex(id)}$`, 'i'));

            // 1. Buscar usuarios por nombre de rol (sin filtrar empresa en query para debugging y robustez)
            const candidates = await UsuarioModel.find({
                rol: { $in: identifiers }
            });

            console.log(`♻️ [Sync] Candidatos encontrados por nombre de rol: ${candidates.length}`);

            let updatedCount = 0;

            for (const user of candidates) {
                // 2. Verificar Empresa manualmente
                // Convertir a string para evitar problemas de tipos (ObjectId vs String)
                let matchesCompany = true;

                if (role.empresa) {
                    // Si el usuario no tiene empresa, no coincide
                    if (!user.empresa) {
                        matchesCompany = false;
                    } else {
                        matchesCompany = String(user.empresa) === String(role.empresa);
                    }
                }

                if (!matchesCompany) {
                    console.log(`   ⏭️ Saltando usuario ${user.correo} (Empresa no coincide)`);
                    continue;
                }

                // 3. Aplicar Actualización indivudual
                let modified = false;

                // Forzar actualización de permisos
                // Nota: Mongoose a veces no detecta cambios en arrays si no se reasigna
                user.permisos = [...role.permisos];
                modified = true;

                // Actualizar Nombre de Rol explícitamente al nuevo
                if (user.rol !== role.nombre) {
                    user.rol = role.nombre;
                    modified = true;
                }

                if (modified) {
                    await user.save();
                    updatedCount++;
                    console.log(`   ✅ Usuario actualizado: ${user.correo} (${user._id})`);
                }
            }

            console.log(`♻️ [Sync] Finalizado. Total actualizados: ${updatedCount}`);

        } catch (syncError) {
            console.error('❌ Error sincronizando permisos a usuarios:', syncError);
            // No fallamos el request principal, pero logueamos el error
        }

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
        const usuarioEmpresaId = req.usuario.empresaId;

        const role = await Role.findById(id);
        if (!role) return res.status(404).json({ msg: 'Rol no encontrado' });

        // Protección de roles del sistema
        const systemRoles = ['admin-general', 'admin-subroot', 'admin-interno', 'administrador-interno'];
        if (systemRoles.includes(role.slug)) {
            return res.status(403).json({ msg: 'Los roles del sistema no pueden ser eliminados.' });
        }

        // Verificar scope: solo puede eliminar roles de su propia empresa
        if (usuarioEmpresaId && String(role.empresa) !== String(usuarioEmpresaId)) {
            return res.status(403).json({ msg: 'No autorizado para eliminar este rol' });
        }

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
