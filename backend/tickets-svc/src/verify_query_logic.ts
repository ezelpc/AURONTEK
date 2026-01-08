import mongoose from 'mongoose';
import Servicio from './Models/Servicio';
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

const verify = async () => {
    try {
        await mongoose.connect(MONGODB_URI);

        // This is the literal objectId we saw in the logs for "Aurontek HQ"
        // Emp: 6942f22afad205160277e1ff
        const empresaIdUsuario = new mongoose.Types.ObjectId('6942f22afad205160277e1ff');

        const filtro: any = {};
        filtro.alcance = 'local';
        filtro.$or = [
            { empresaId: empresaIdUsuario },
            { empresaId: null },
            { empresaId: { $exists: false } }
        ];

        console.log('--- Simulating Backend Query ---');
        console.log('Filter:', JSON.stringify(filtro, null, 2));

        const servicios = await Servicio.find(filtro).sort({ nombre: 1 });

        let output = `Found ${servicios.length} services matching query:\n`;
        servicios.forEach(s => {
            output += `> "${s.nombre}" | Kat: ${s.categoria} | Emp: ${s.empresaId}\n`;
        });

        console.log(output);

        const fs = require('fs');
        fs.writeFileSync('query_simulation_log.txt', output);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

verify();
