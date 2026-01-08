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

const check = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log(`✅ Connected to ${MONGODB_URI}`);

        const services = await Servicio.find({});
        let output = `Found ${services.length} services:\n`;
        services.forEach(s => {
            output += `- [${s._id}] "${s.nombre}" | Tip: ${s.tipo} | Cat: ${s.categoria} | Alc: ${s.alcance} | Act: ${s.activo} | Emp: ${s.empresaId}\n`;
        });

        const fs = require('fs');
        fs.writeFileSync('services_dump_log.txt', output);
        console.log('Dump written to services_dump_log.txt');


        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

check();
