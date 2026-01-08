import mongoose from 'mongoose';
import Usuario from './Models/AltaUsuario.models';
import { Empresa } from './Models/AltaEmpresas.models';
import dotenv from 'dotenv';
import path from 'path';

const ENV = process.env.NODE_ENV || 'development';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aurontek';

if (ENV === 'development') {
    const rootEnvPath = path.resolve(__dirname, '../../../.env');
    const localEnvPath = path.resolve(__dirname, '../.env');
    dotenv.config({ path: rootEnvPath });
    dotenv.config({ path: localEnvPath });
}

const check = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log(`✅ Connected to ${MONGODB_URI}`);

        const empleado = await Usuario.findOne({ correo: 'empleado@aurontek.com' });
        if (!empleado) {
            console.log('❌ User empleado@aurontek.com not found');
        } else {
            console.log(`👤 User: ${empleado.nombre} (${empleado._id})`);
            console.log(`   EmpresaRef: ${empleado.empresa}`);

            const empresa = await Empresa.findById(empleado.empresa);
            if (empresa) {
                console.log(`   🏢 Empresa Name: ${empresa.nombre} (${empresa._id})`);
            } else {
                console.log(`   ❌ Empresa referenced not found!`);
            }
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

check();
