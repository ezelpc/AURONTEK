import axios from 'axios';
import jwt from 'jsonwebtoken';

const LOGIN_URL = 'http://localhost:3001/auth/login'; // Hit Usuarios SVC directly to avoid Gateway issues if any
const EMAIL = 'empleado@aurontek.com';
const PASS = 'User123!';

const run = async () => {
    try {
        console.log(`🔐 Logging in as ${EMAIL}...`);
        const res = await axios.post(LOGIN_URL, {
            correo: EMAIL,
            contraseña: PASS
        });

        console.log(`✅ Login Success! Status: ${res.status}`);
        const token = res.data.token;
        if (!token) {
            console.error('❌ No token returned');
            return;
        }

        const decoded: any = jwt.decode(token);
        console.log('--- Decoded Token ---');
        console.log(`User ID: ${decoded.id}`);
        console.log(`Name: ${decoded.nombre}`);
        console.log(`Role: ${decoded.rol}`);
        console.log(`Empresa ID: ${decoded.empresaId}`);

        // Output for me to capture
        const fs = require('fs');
        fs.writeFileSync('real_user_id.txt', `EMPRESA_ID=${decoded.empresaId}\nTOKEN=${token}`);

    } catch (error: any) {
        if (error.response) {
            console.error(`❌ Login Failed ${error.response.status}:`, error.response.data);
        } else {
            console.error(`❌ Login Error:`, error.message);
        }
    }
};

run();
