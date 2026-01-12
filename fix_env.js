const fs = require('fs');
const path = require('path');

const fixEnv = (filePath) => {
    const fullPath = path.resolve(process.cwd(), filePath);
    console.log(`Processing: ${fullPath}`);
    let content = '';
    try {
        content = fs.readFileSync(fullPath, 'utf8');
    } catch (e) {
        console.error(`Error reading ${fullPath}:`, e.message);
        return;
    }

    const secret = "JWT_SECRET=60d587709d7160275bfba78a3bfdfca9283cef94bacf334dbe0a";
    
    // Clean up lines
    let lines = content.replace(/\r\n/g, '\n').split('\n');
    lines = lines.filter(l => l.trim() !== '' && !l.startsWith('JWT_SECRET='));
    
    // Add Secret
    lines.push(secret);
    
    // Write back
    fs.writeFileSync(fullPath, lines.join('\n'));
    console.log('Fixed:', filePath);
};

fixEnv('backend/chat-svc/.env');
fixEnv('backend/notificaciones-svc/.env');
