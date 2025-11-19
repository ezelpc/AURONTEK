// Rutas de proxy: mountPath => options
export default {
'/api/v1/auth': {
target: process.env.USUARIOS_SERVICE_URL || 'http://localhost:3001',
pathRewrite: { '^/api/v1/auth': '/auth' },
timeout: 5000
},
'/api/v1/usuarios': {
target: process.env.USUARIOS_SERVICE_URL || 'http://localhost:3001',
pathRewrite: { '^/api/v1/usuarios': '/usuarios' },
timeout: 5000
},
'/api/admin-sistema': {
    target: process.env.USUARIOS_SERVICE_URL || 'http://localhost:3001',
    // Redirige la petición al mismo login que acabamos de arreglar
    pathRewrite: { '^/api/admin-sistema': '/auth' }, 
    timeout: 5000
},
'/api/v1/empresas': {
target: process.env.USUARIOS_SERVICE_URL || 'http://localhost:3001',
pathRewrite: { '^/api/v1/empresas': '/empresas' },
timeout: 5000
},
'/api/v1/tickets': {
target: process.env.TICKETS_SERVICE_URL || 'http://localhost:3002',
pathRewrite: { '^/api/v1/tickets': '/tickets' },
timeout: 5000
},
'/api/v1/chat': {
target: process.env.CHAT_SERVICE_URL || 'http://localhost:3003',
pathRewrite: { '^/api/v1/chat': '/chat' },
timeout: 5000
},
'/api/v1/notifications': {
target: process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3004',
pathRewrite: { '^/api/v1/notifications': '/notifications' },
timeout: 5000
}
};