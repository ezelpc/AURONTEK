
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Usuario from './Models/AltaUsuario.models';
import { Empresa } from './Models/AltaEmpresas.models';
import Admin from './Models/Admin.model';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const run = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI is not defined');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(uri);
        console.log('Connected.');

        console.log('\n--- ADMIN GENERAL ---');
        const admins = await Admin.find({});
        admins.forEach(a => {
            console.log(`- ${a.correo} (Rol: ${a.rol})`);
        });

        console.log('\n--- EMPRESAS ---');
        const empresas = await Empresa.find({});
        const empresaMap = new Map();
        empresas.forEach(e => {
            empresaMap.set(e._id.toString(), e);
            console.log(`- [${e._id}] ${e.nombre} | Código: ${e.codigo_acceso} | Activo: ${e.activo}`);
        });

        console.log('\n--- USUARIOS ---');
        const usuarios = await Usuario.find({});
        usuarios.forEach(u => {
            const emp = u.empresa ? empresaMap.get(u.empresa.toString()) : null;
            const empName = emp ? emp.nombre : 'SIN EMPRESA';
            const empCode = emp ? emp.codigo_acceso : 'N/A';

            console.log(`- [${u._id}] ${u.correo} | Rol: ${u.rol} | Empresa: ${empName} (${u.empresa}) | Code Expected: ${empCode}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
