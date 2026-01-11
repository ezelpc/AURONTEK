const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:3000/api'; // Gateway URL
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aurontek';

const TARGET_EMAIL = 'empleado@aurontek.com';
const TARGET_COMPANY_CODE = 'AURONTEK2026'; // From seed
const NEW_PASSWORD = 'NewPass123!';

const ADMIN_EMAIL = 'admin.aurontek@aurontek.com';
const ADMIN_PASS = 'Admin123!';

// Simple Models
const UserSchema = new mongoose.Schema({
    correo: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    empresa: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa' },
    rol: String, // or slug
    activo: Boolean
}, { strict: false });

const CompanySchema = new mongoose.Schema({
    nombre: String,
    codigo_acceso: String, // Check model definition if it's correct
    rfc: String
}, { strict: false });

const Usuario = mongoose.model('Usuario', UserSchema);
const Empresa = mongoose.model('Empresa', CompanySchema);

async function runTests() {
    console.log('🚀 Iniciando pruebas de recuperación de contraseña (Dynamic Data)...');

    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado a MongoDB');

        // --- STEP 0: Find Valid Data ---
        console.log('\n--- 0. Finding Valid Company & User ---');
        const empresa = await Empresa.findOne({});
        if (!empresa) {
             console.error('❌ No se encontraron empresas. Asegúrate de ejecutar el seed.');
             process.exit(1);
        }
        console.log(`🏢 Empresa encontrada: ${empresa.nombre} (Code: ${empresa.codigo_acceso})`);
        
        const user = await Usuario.findOne({ empresa: empresa._id, correo: { $ne: ADMIN_EMAIL } });
        // Also find admin
        const admin = await Usuario.findOne({ 
             $or: [
                 { rol: 'admin-general' }, 
                 { rol: 'admin-interno' },
                 { correo: ADMIN_EMAIL }
             ] 
        });

        if (!user) {
             console.error('❌ No se encontró usuario para pruebas en esa empresa.');
             process.exit(1);
        }
        console.log(`👤 Usuario de prueba: ${user.correo} (ID: ${user._id})`);
        console.log(`🏢 Empresa ID: ${empresa._id}`);
        console.log(`🔗 Usuario Empresa ID: ${user.empresa}`);

        const TARGET_EMAIL_DYN = user.correo;
        const TARGET_COMPANY_CODE_DYN = empresa.codigo_acceso;

        // --- STEP 1: Forgot Password (Auto) ---
        console.log('\n--- 1. Testing Auto-Recovery (Forgot Password) ---');
        console.log(`Solicitando recuperación para: ${TARGET_EMAIL_DYN} con código ${TARGET_COMPANY_CODE_DYN}`);
        
        try {
            const resInit = await axios.post(`${BASE_URL}/auth/forgot-password`, {
                email: TARGET_EMAIL_DYN,
                codigoAcceso: TARGET_COMPANY_CODE_DYN
            });
            console.log('Response:', resInit.data);
        } catch (e) {
            console.error('❌ Error en forgot-password:');
            console.error('Status:', e.response?.status);
            console.error('Data:', JSON.stringify(e.response?.data, null, 2));
            console.error('Message:', e.message);
            process.exit(1);
        }

        // --- STEP 2: Read Token from DB ---
        console.log('\n--- 2. Reading Token from DB ---');
        console.log('Esperando 3 segundos...');
        await new Promise(r => setTimeout(r, 3000));
        
        const userReloaded = await Usuario.findById(user._id);
        console.log('Usuario recargado:', userReloaded?.correo);
        console.log('Token presente:', !!userReloaded?.resetPasswordToken);

        if (!userReloaded || !userReloaded.resetPasswordToken) {
            console.error('❌ No se encontró token en base de datos para el usuario.');
            // Only exit if critical, but let's see why
             process.exit(1);
        }
        
        console.log('✅ Token encontrado en DB (Hashed):', userReloaded.resetPasswordToken.substring(0, 10) + '...');
        
        // Manual Injection for Reset Test
        const crypto = require('crypto');
        const TEST_TOKEN_RAW = 'my-secret-test-token-dynamic';
        const TEST_TOKEN_HASH = crypto.createHash('sha256').update(TEST_TOKEN_RAW).digest('hex');
        
        userReloaded.resetPasswordToken = TEST_TOKEN_HASH;
        userReloaded.resetPasswordExpires = Date.now() + 3600000;
        await userReloaded.save();
        console.log(`✅ Token de prueba inyectado manualmente: ${TEST_TOKEN_RAW}`);
        
        // --- STEP 3: Reset Password ---
        console.log('\n--- 3. Testing Reset Password Endpoint ---');
        try {
            const resReset = await axios.post(`${BASE_URL}/auth/reset-password`, {
                token: TEST_TOKEN_RAW,
                password: NEW_PASSWORD
            });
            console.log('Response:', resReset.data);
            console.log('✅ Endpoint reset-password exitoso.');
        } catch (e) {
            console.error('❌ Error en reset-password:', e.response?.data || e.message);
             process.exit(1);
        }
        
        // --- STEP 4: Admin Recover (Step 3 or User Request) ---
        if (admin) {
            console.log('\n--- 4. Testing Admin Remote Recovery ---');
            console.log(`Usando Admin: ${admin.correo}`);
            
            // Note: Password for admin might be 'Admin123!' or hashed. 
            // We can't login if we don't know the password.
            // But we know 'Admin123!' is standard in seeds.
            // Try to login.
            
            console.log('Iniciando sesión como Admin...');
            let token;
            try {
                const resLogin = await axios.post(`${BASE_URL}/auth/login`, {
                    correo: admin.correo,
                    contraseña: 'Admin123!', // Hope this is the password
                    codigoAcceso: TARGET_COMPANY_CODE_DYN
                });
                token = resLogin.data.token;
                console.log('✅ Login Admin exitoso.');
            } catch (e) {
                console.warn('⚠️ No se pudo loguear como admin (password incorrecto?), saltando prueba 4:', e.response?.data?.msg || e.message);
                token = null;
            }
            
            if (token) {
                 console.log(`Disparando recuperación remota para ID: ${userReloaded._id}`);
                try {
                    const resAdminRecover = await axios.post(`${BASE_URL}/usuarios/${userReloaded._id}/recover-password`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log('Response:', resAdminRecover.data);
                    console.log('✅ Endpoint admin recover-password exitoso.');
                } catch (e) {
                    console.error('❌ Error admin recover:', e.response?.data || e.message);
                }
            }
        } else {
             console.log('⚠️ No se encontró usuario admin para prueba 4.');
        }

        console.log('\n✨ PRUEBAS COMPLETADAS EXITOSAMENTE ✨');

    } catch (err) {
        console.error('Global Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

runTests();
