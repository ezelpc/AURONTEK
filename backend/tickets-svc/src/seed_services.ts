import mongoose from 'mongoose';
import Servicio from './Models/Servicio';
import dotenv from 'dotenv';
import path from 'path';

// Load env
const ENV = process.env.NODE_ENV || 'development';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aurontek';

if (ENV === 'development') {
    const rootEnvPath = path.resolve(__dirname, '../../../.env');
    const localEnvPath = path.resolve(__dirname, '../.env');
    dotenv.config({ path: rootEnvPath });
    dotenv.config({ path: localEnvPath });
}

const SERVICES = [
    {
        nombre: 'Soporte General PC',
        tipo: 'Requerimiento',
        categoria: 'Computo Personal',
        gruposDeAtencion: 'Mesa de Servicio',
        prioridad: 'Media',
        alcance: 'global'
    },
    {
        nombre: 'Acceso a Servidores',
        tipo: 'Requerimiento',
        categoria: 'Infraestructura',
        gruposDeAtencion: 'Soporte Ti',
        prioridad: 'Alta',
        alcance: 'global'
    }
];

// Minimal Empresa Model for lookup
const empresaSchema = new mongoose.Schema({ nombre: String });
const Empresa = mongoose.models.Empresa || mongoose.model('Empresa', empresaSchema);

const seed = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log(`✅ Connected to ${MONGODB_URI}`);

        // Get Company ID
        const empresa = await Empresa.findOne({ nombre: 'Aurontek HQ' });
        if (!empresa) {
            console.error('❌ Aurontek HQ not found in DB. Run usuarios-svc seed first.');
            process.exit(1);
        }
        console.log(`🏢 Found Company: ${empresa.nombre} (${empresa._id})`);

        const SERVICES = [
            {
                nombre: 'Soporte General PC',
                tipo: 'Requerimiento',
                categoria: 'Computo Personal',
                gruposDeAtencion: 'Mesa de Servicio',
                prioridad: 'Media',
                alcance: 'local',
                empresaId: empresa._id,
                activo: true
            },
            {
                nombre: 'Acceso a Servidores',
                tipo: 'Requerimiento',
                categoria: 'Infraestructura',
                gruposDeAtencion: 'Soporte Ti',
                prioridad: 'Alta',
                alcance: 'local',
                empresaId: empresa._id,
                activo: true
            }
        ];

        for (const svc of SERVICES) {
            let exists = await Servicio.findOne({ nombre: svc.nombre });
            if (!exists) {
                await Servicio.create(svc);
                console.log(`✅ Created service: ${svc.nombre} [${svc.gruposDeAtencion}] (Local)`);
            } else {
                exists.gruposDeAtencion = svc.gruposDeAtencion;
                exists.alcance = 'local'; // Force update
                exists.empresaId = empresa._id; // Force update
                await exists.save();
                console.log(`🔄 Updated service: ${svc.nombre} -> Local / ${empresa._id}`);
            }
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seed();
