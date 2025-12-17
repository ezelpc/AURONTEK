// Test script para verificar la detección de .env en tickets-svc
const path = require('path');
const fs = require('fs');

console.log('\n========================================');
console.log('VERIFICACIÓN DE RUTAS .ENV');
console.log('========================================\n');

console.log('📂 Directorio actual (__dirname simulado):');
const simulatedDirname = path.resolve(__dirname, '../src');
console.log(`   ${simulatedDirname}\n`);

// Simular la lógica de tickets-svc/src/index.ts
const localEnvPath = path.resolve(simulatedDirname, '../.env');
const rootEnvPath = path.resolve(simulatedDirname, '../../../.env');

console.log('🔍 Rutas calculadas:\n');
console.log(`1. Local (.env en tickets-svc):`);
console.log(`   ${localEnvPath}`);
console.log(`   Existe: ${fs.existsSync(localEnvPath) ? '✅ SÍ' : '❌ NO'}\n`);

console.log(`2. Raíz (.env en AURONTEK):`);
console.log(`   ${rootEnvPath}`);
console.log(`   Existe: ${fs.existsSync(rootEnvPath) ? '✅ SÍ' : '❌ NO'}\n`);

// Determinar cuál se usaría
if (fs.existsSync(localEnvPath)) {
    console.log('✅ SE USARÁ: .env LOCAL (tickets-svc/.env)');
    console.log('📄 Contenido del archivo:\n');
    const content = fs.readFileSync(localEnvPath, 'utf8');
    const lines = content.split('\n').slice(0, 10);
    lines.forEach(line => {
        if (line.trim() && !line.startsWith('#')) {
            // Ocultar valores sensibles
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=');
            const maskedValue = value.length > 20 ? value.substring(0, 20) + '...' : value;
            console.log(`   ${key}=${maskedValue}`);
        }
    });
} else if (fs.existsSync(rootEnvPath)) {
    console.log('⚠️  SE USARÁ: .env RAÍZ (AURONTEK/.env)');
} else {
    console.log('❌ NO SE ENCONTRÓ NINGÚN ARCHIVO .env');
}

console.log('\n========================================\n');
