const http = require('http');

function get(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, data }));
        }).on('error', reject);
    });
}

async function check() {
    try {
        console.log('--- Checking Chat Service Health (3003) ---');
        const healthRes = await get('http://localhost:3003/health');
        console.log('Health Status:', healthRes.statusCode);
        console.log('Health Data:', healthRes.data);

        console.log('\n--- Checking Chat Route Existance (3003) ---');
        // Usamos un ID fake. Si existe la ruta, deberia dar 401/403. Si no, 404.
        const chatRes = await get('http://localhost:3003/fake_id/mensajes');
        console.log('Route Status:', chatRes.statusCode);
        console.log('Route Data:', chatRes.data.substring(0, 100));

    } catch (err) {
        console.error('Error:', err.message);
    }
}

check();
