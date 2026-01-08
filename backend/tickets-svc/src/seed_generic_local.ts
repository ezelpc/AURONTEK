import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars to get secret
const ENV = process.env.NODE_ENV || 'development';
const rootEnvPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: rootEnvPath });

const SECRET = process.env.JWT_SECRET || 'secret_dev_123';

// Use a VALID 24-char hex ID
const ADMIN_ID = '123456789012345678901234';

const payload = {
    id: ADMIN_ID,
    nombre: 'Super Admin',
    email: 'admin@aurontek.com',
    rol: 'admin-general',
    permisos: ['*'],
    empresaId: undefined // Explicitly undefined to ensure generic
};

const token = jwt.sign(payload, SECRET, { expiresIn: '1h' });

const SERVICES_TO_SEED = [
    {
        nombre: 'Acceso a Servidores',
        tipo: 'Requerimiento',
        categoria: 'Infraestructura',
        gruposDeAtencion: 'Soporte Ti',
        prioridad: 'Alta',
        alcance: 'local',
        activo: true,
        descripcion: 'Solicitud de acceso a servidores internos'
    }
    // Skipping Soporte PC as it seems Computo Personal category already shows 1 item (the example one)
    // Actually, let's add Soporte General PC too to replace/add to it.
    ,
    {
        nombre: 'Soporte General PC',
        tipo: 'Requerimiento',
        categoria: 'Computo Personal',
        gruposDeAtencion: 'Mesa de Servicio',
        prioridad: 'Media',
        alcance: 'local',
        activo: true,
        descripcion: 'Soporte básico para PC y laptops'
    }
];

const run = async () => {
    try {
        console.log(`🔑 Creating Token with Secret: ${SECRET.substring(0, 4)}...`);
        console.log(`Target: http://localhost:3002/services`);

        for (const svc of SERVICES_TO_SEED) {
            console.log(`🚀 Creating: ${svc.nombre}...`);
            await axios.post('http://localhost:3002/services', svc, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`✅ Created!`);
        }

    } catch (error: any) {
        if (error.response) {
            console.log(`❌ Error ${error.response.status}:`, JSON.stringify(error.response.data));
        } else {
            console.log(`❌ Error connection:`, error.message);
        }
    }
};

run();
