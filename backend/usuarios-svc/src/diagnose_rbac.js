
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Force load env
dotenv.config();

const run = async () => {
    try {
        console.log('🚀 Starting RBAC Diagnosis (JS Mode)...');
        
        // Hardcode fallback just in case
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aurontek';
        console.log(`🔌 Connecting to: ${uri}`);
        
        await mongoose.connect(uri);
        console.log('✅ Connected.');

        // Define Schemas manually to avoid import issues
        const permSchema = new mongoose.Schema({ nombre: String, slug: String, empresa: mongoose.Schema.Types.ObjectId, permisos: [String] }, { collection: 'roles' });
        const RoleModel = mongoose.model('Role', permSchema);
        
        const userSchema = new mongoose.Schema({ nombre: String, correo: String, rol: String, empresa: mongoose.Schema.Types.ObjectId, permisos: [String] }, { collection: 'usuarios' });
        const UsuarioModel = mongoose.model('Usuario', userSchema);

        // 1. Find User
        const targetEmail = 'opg0720@hotmail.com';
        const user = await UsuarioModel.findOne({ correo: targetEmail });

        if (!user) {
            console.error('❌ User not found!');
            return;
        }

        console.log('👤 [User Details]');
        console.log(`   ID: ${user._id}`);
        console.log(`   Name: ${user.nombre}`);
        console.log(`   Role: '${user.rol}'`);
        console.log(`   Company: ${user.empresa}`);
        console.log(`   Direct Permissions: ${user.permisos.length}`);
        // console.log(user.permisos);

        // 2. Find Role
        // Logic: Role name/slug match AND company match (or global)
        const role = await RoleModel.findOne({
            $and: [
                { $or: [{ nombre: user.rol }, { slug: user.rol }] },
                { $or: [{ empresa: user.empresa }, { empresa: null }] }
            ]
        });

        if (!role) {
            console.log('❌ No matching Role found in DB!');
            
            // AUTO-CREATE MISSING ROLE
            console.log('🛠 [Auto-Fix] Creating missing "Administrador Interno" role for this company...');
            
            const newRole = new RoleModel({
                nombre: 'Administrador Interno',
                slug: 'admin-interno',
                empresa: user.empresa,
                descripcion: 'Rol administrativo (Restaurado autom.)',
                activo: true,
                permisos: [
                    'users.view', 'users.create', 'users.update', 'users.delete',
                    'roles.view', 'roles.create', 'roles.edit', 'roles.delete', 'roles.manage',
                    'servicios.view_local', 'servicios.manage_local',
                    'tickets.create', 'tickets.view_all', 'tickets.manage',
                    'dashboard.view'
                ]
            });
            
            await newRole.save();
            console.log(`   ✅ Role Created: ${newRole._id}`);
            
            // Use this new role for sync
            // Re-assign 'role' variable (shadowing or mutating logic flow)
            // We'll just run the sync logic explicitly here
            
            console.log('\n🛠 [Auto-Fix] Syncing permissions to User...');
            user.permisos = [...newRole.permisos];
            user.rol = newRole.nombre;
            await user.save();
            console.log('   ✅ User synced and saved.');
            
            return; // Exit as we are done
            return; // Exit as we are done
        } else {
            console.log(`✅ Role Found: ${role.nombre} (ID: ${role._id})`);
            console.log(`   Role Permissions: ${role.permisos.length}`);
            
            // Check critical
            const critical = ['users.view', 'users.update', 'users.create', 'users.delete', 'roles.view'];
            critical.forEach(p => {
                const has = role.permisos.includes(p);
                console.log(`      - ${p}: ${has ? '✅' : '❌'}`);
                
                // FORCE FIX ROLE IF MISSING
                if (!has) {
                    console.log(`      ⚠️ Missing critical permission in ROLE! Adding ${p}...`);
                    role.permisos.push(p);
                }
            });
            
            // Save role if changed
            if (role.isModified('permisos')) {
                await role.save();
                console.log('   💾 Role permissions updated.');
            }

            // 3. FORCE SYNC TO USER
            console.log('\n🛠 [Auto-Fix] Syncing permissions to User...');
            user.permisos = [...role.permisos];
            user.rol = role.nombre; // Normalize
            await user.save();
            console.log('   ✅ User synced and saved.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
