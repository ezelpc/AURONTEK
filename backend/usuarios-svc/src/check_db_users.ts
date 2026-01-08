import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Usuario from './Models/AltaUsuario.models';
import { Empresa } from './Models/AltaEmpresas.models';

const ENV = process.env.NODE_ENV || 'development';
if (ENV === 'development') {
    const rootEnvPath = path.resolve(__dirname, '../../../.env');
    const localEnvPath = path.resolve(__dirname, '../.env');
    dotenv.config({ path: rootEnvPath });
    dotenv.config({ path: localEnvPath });
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aurontek';

import fs from 'fs';

const check = async () => {
    try {
        if (!MONGODB_URI) throw new Error('MONGODB_URI missing');
        await mongoose.connect(MONGODB_URI);
        const logContent = [];
        logContent.push(`✅ Connected to: ${MONGODB_URI.split('@')[1] || 'LocalDB'}`);

        logContent.push('\n--- EMPRESAS ---');
        const empresas = await Empresa.find({});
        logContent.push(`Found ${empresas.length} companies.`);
        empresas.forEach(e => logContent.push(`- [${e._id}] ${e.nombre}`));

        logContent.push('\n--- USUARIOS ---');
        const usuarios = await Usuario.find({}).populate('empresa');
        logContent.push(`Found ${usuarios.length} users.`);
        usuarios.forEach(u => {
            const empName = (u.empresa as any)?.nombre || 'SIN EMPRESA';
            logContent.push(`- ${u.correo} | Rol: ${u.rol} | Emp: ${empName} | Grupos: [${u.gruposDeAtencion?.join(', ')}] `);
        });

        fs.writeFileSync('users_dump.txt', logContent.join('\n'));
        console.log('Dump written to users_dump.txt');
        process.exit(0);
    } catch (error: any) {
        console.error(error);
        fs.writeFileSync('users_dump.txt', `ERROR: ${error.message}`);
        process.exit(1);
    }
};

check();
