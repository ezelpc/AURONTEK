
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config();

const run = async () => {
    try {
        console.log('🚀 Starting Permission Fix Script...');
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error('❌ MONGODB_URI is missing');
            return;
        }
        await mongoose.connect(uri);
        console.log('✅ Connected to Mongo');

        const RoleModel = (await import('./Models/Role.model')).default;
        const UsuarioModel = (await import('./Models/AltaUsuario.models')).default;

        // 1. Find the Role "Administrador Interno"
        // We look for name or slug variants
        const roleName = "Administrador Interno";
        const role = await RoleModel.findOne({
            $or: [
                { nombre: roleName },
                { slug: 'admin-interno' },
                { nombre: /admin.*interno/i }
            ]
        });

        if (!role) {
            console.log('❌ Role "Administrador Interno" NOT found in DB. Cannot fix.');
            return;
        }

        console.log(`✅ Role Found: ${role.nombre} (ID: ${role._id})`);
        console.log(`info: Role Permissions Count: ${role.permisos.length}`);

        // 2. Add Critical Permissions
        const missingPerms = [
            'users.view', 'users.create', 'users.update', 'users.delete',
            'roles.view', 'roles.create', 'roles.edit', 'roles.delete', 'roles.manage',
            'servicios.view_local', 'servicios.manage_local',
            'tickets.create', 'tickets.view_all', 'tickets.manage'
        ];

        let addedCount = 0;
        missingPerms.forEach(p => {
            if (!role.permisos.includes(p)) {
                role.permisos.push(p);
                addedCount++;
                console.log(`   + Added permission: ${p}`);
            }
        });

        if (addedCount > 0) {
            await role.save();
            console.log(`💾 Role '${role.nombre}' updated with ${addedCount} new permissions.`);
        } else {
            console.log(`Contains all critical permissions already.`);
        }

        // 3. Force Sync to Users
        console.log('🔄 Syncing users...');
        // Find users with this role name or slug
        const candidates = await UsuarioModel.find({
            rol: { $in: [role.nombre, role.slug, 'admin-interno', 'Administrador Interno'] }
        });

        console.log(`   Found ${candidates.length} candidates.`);

        for (const user of candidates) {
            // Verify Company match (if role has company)
            if (role.empresa && String(user.empresa) !== String(role.empresa)) {
                // Skip mismatch
                continue;
            }

            // Update
            user.permisos = [...role.permisos];
            if (user.rol !== role.nombre) {
                user.rol = role.nombre; // Normalize name
            }
            await user.save();
            console.log(`   ✅ User ${user.correo} synced.`);
        }

        console.log('🎉 Done.');

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
