import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars to get secret
const ENV = process.env.NODE_ENV || 'development';
const rootEnvPath = path.resolve(__dirname, '../../../.env'); // Adjust based on location
dotenv.config({ path: rootEnvPath });

// Fallback secret if not found (hoping it matches dev default)
const SECRET = process.env.JWT_SECRET || 'secret_dev_123';

// "Aurontek HQ" ID from logs: 6942f22afad205160277e1ff
const EMPRESA_ID = '6942f22afad205160277e1ff';

const payload = {
    id: '123456789012345678901234', // Fake User ID
    nombre: 'Empleado Test',
    email: 'empleado@aurontek.com',
    rol: 'usuario',
    empresaId: EMPRESA_ID
};

const token = jwt.sign(payload, SECRET, { expiresIn: '1h' });

const run = async () => {
    try {
        console.log(`🔑 Using Token with Secret: ${SECRET.substring(0, 4)}...`);
        console.log(`🎯 Target: http://localhost:3002/services?alcance=local`);

        const res = await axios.get('http://localhost:3002/services?alcance=local', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        let output = `✅ Status: ${res.status}\n`;
        output += `📦 Data Length: ${res.data.length}\n`;
        res.data.forEach((s: any) => {
            output += `- ${s.nombre} (${s.categoria}) [Alcance: ${s.alcance}] [EmpID: ${s.empresaId || 'N/A'}]\n`;
        });

        const fs = require('fs');
        fs.writeFileSync('api_debug_log.txt', output);
        console.log('Log written to api_debug_log.txt');

    } catch (error: any) {
        if (error.response) {
            console.error(`❌ Error ${error.response.status}:`, error.response.data);
        } else {
            console.error(`❌ Error connection:`, error.message);
        }
    }
};

run();
