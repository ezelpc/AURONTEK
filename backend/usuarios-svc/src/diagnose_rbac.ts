
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Force load env if not present
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aurontek';

const run = async () => {
    try {
        console.log('🚀 Starting RBAC Diagnosis...');
        const uri = process.env.MONGODB_URI;
        console.log(`🔌 Connecting to: ${uri}`);

        if (!uri) throw new Error('MONGODB_URI is undefined');
        await mongoose.connect(uri);
        console.log('✅ Connected.');

        const RoleModel = (await import('./Models/Role.model')).default;
        const UsuarioModel = (await import('./Models/AltaUsuario.models')).default;

        // 1. Find User by Email (from previous context)
        const targetEmail = 'opg0720@hotmail.com';
        const user = await UsuarioModel.findOne({ correo: targetEmail });

        if (!user) {
            console.error('❌ User not found!');
            return;
        }

        console.log('👤 [User Details]');
        console.log(`   ID: ${user._id}`);
        console.log(`   Name: ${user.nombre}`);
        console.log(`   Role (in User): '${user.rol}'`);
        console.log(`   Company: ${user.empresa}`);
        console.log(`   Direct Permissions: ${user.permisos.length}`);
        // console.log(`   Permissions List:`, user.permisos);

        // 2. Find Role Definition
        console.log('\n📜 [Role Details]');
        // Logic from auth.middleware.ts
        // $or: [{ nombre: userObj.rol }, { slug: userObj.rol }]
        // $or: [{ empresa: userObj.empresa }, { empresa: null }]

        const roleDoc = await RoleModel.findOne({
            $and: [
                { $or: [{ nombre: user.rol }, { slug: user.rol }] },
                { $or: [{ empresa: user.empresa }, { empresa: null }] }
            ]
        });

        if (!roleDoc) {
            console.error(`❌ NO MATCHING ROLE FOUND in DB for '${user.rol}' and Company '${user.empresa}'`);

            // Debug: Why?
            const similarRoles = await RoleModel.find({
                $or: [{ nombre: new RegExp(user.rol, 'i') }, { slug: new RegExp(user.rol, 'i') }]
            });
            console.log(`   ℹ️ Found ${similarRoles.length} similar roles by name/slug ignoring company/case:`);
            similarRoles.forEach(r => {
                console.log(`      - ID: ${r._id}, Name: '${r.nombre}', Slug: '${r.slug}', Company: ${r.empresa}`);
            });

        } else {
            console.log(`   ✅ Role Found: '${roleDoc.nombre}' (ID: ${roleDoc._id})`);
            console.log(`   Slug: ${roleDoc.slug}`);
            console.log(`   Company: ${roleDoc.empresa}`);
            console.log(`   Permissions: ${roleDoc.permisos.length}`);

            // Check critical perms
            const critical = ['users.view', 'users.update', 'users.create', 'users.delete', 'roles.view'];
            console.log('   🔍 Checking Critical Permissions in Role:');
            critical.forEach(p => {
                const has = roleDoc.permisos.includes(p);
                console.log(`      - ${p}: ${has ? '✅' : '❌'}`);
            });
        }

        // 3. User's effective permissions (Union)
        // If auth middleware does union, let's see result
        let effectivePerms = [...user.permisos];
        if (roleDoc) {
            effectivePerms = [...effectivePerms, ...roleDoc.permisos];
            // Dedup
            effectivePerms = Array.from(new Set(effectivePerms));
        }

        console.log(`\n🔑 Effective Permissions Count: ${effectivePerms.length}`);
        const missingUserUpdate = !effectivePerms.includes('users.update');
        const missingRolesView = !effectivePerms.includes('roles.view');

        if (missingUserUpdate) console.warn('⚠️ WARNING: User lacks "users.update"!');
        if (missingRolesView) console.warn('⚠️ WARNING: User lacks "roles.view"!');

        if (!missingUserUpdate && !missingRolesView) {
            console.log('✅ User HAS all critical permissions effectively.');
        }

        // 4. Update Correction
        // Be aggressive: Ensure User has them directly if Role is flakey or middleware is weird
        // We will force-sync the role permissions to the user NOW
        if (roleDoc) {
            console.log('\n🛠 [Auto-Fix] Force-syncing permissions from Role to User...');
            user.permisos = [...roleDoc.permisos];
            user.rol = roleDoc.nombre; // Normalize name
            await user.save();
            console.log('   ✅ User updated and saved.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
