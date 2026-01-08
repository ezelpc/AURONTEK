
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config();

console.log('CWD:', process.cwd());

const run = async () => {
    try {
        console.log('🚀 Starting Debug Script...');
        if (!process.env.MONGO_URI) {
            console.error('❌ MONGO_URI is missing');
            return;
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to Mongo');

        const UsuarioModel = (await import('./Models/AltaUsuario.models')).default;
        const RoleModel = (await import('./Models/Role.model')).default;

        const targetEmail = 'opg0720@hotmail.com';
        const user = await UsuarioModel.findOne({ correo: targetEmail });

        if (!user) {
            console.log(`❌ User not found with email: ${targetEmail}`);
            // List all users to see if email is different
            const allUsers = await UsuarioModel.find({}).limit(5);
            console.log('First 5 users:', allUsers.map(u => u.correo));
            return;
        }

        console.log('✅ User Found:', {
            id: user._id,
            nombre: user.nombre,
            rol: user.rol,
            empresa: user.empresa,
            permisosCount: user.permisos.length,
            permisos: user.permisos // Print actual permissions
        });

        // Search for roles with this name
        const roles = await RoleModel.find({ nombre: user.rol });
        console.log(`🔎 Found ${roles.length} roles with name '${user.rol}'`);

        roles.forEach((r, i) => {
            console.log(`\n[Role #${i}]`);
            console.log(`  ID: ${r._id}`);
            console.log(`  Nombre: '${r.nombre}'`);
            console.log(`  Slug: '${r.slug}'`);
            console.log(`  Empresa: ${r.empresa}`);
            console.log(`  Match User Empresa? ${String(r.empresa) === String(user.empresa)}`);

            // Test query
            const filter = {
                rol: r.nombre,
                // If role has company, include it
                ...(r.empresa ? { empresa: r.empresa } : {})
            };
            console.log(`  Query used would be:`, JSON.stringify(filter));

            // Check if user matches this query (manual check)
            let match = true;
            if (filter.rol !== user.rol) match = false;
            // If filter has empresa, user must match
            if (filter.empresa && String(filter.empresa) !== String(user.empresa)) match = false;

            console.log(`  => Would this role update this user? ${match ? 'YES' : 'NO'}`);
        });

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

run();
