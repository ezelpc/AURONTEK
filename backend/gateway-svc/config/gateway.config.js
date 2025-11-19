export const services = {
auth: { url: process.env.USUARIOS_SERVICE_URL || 'http://localhost:3001', routes: ['/auth/*'] },
usuarios: { url: process.env.USUARIOS_SERVICE_URL || 'http://localhost:3001', routes: ['/usuarios/*', '/empresas/*'] },
tickets: { url: process.env.TICKETS_SERVICE_URL || 'http://localhost:3002', routes: ['/tickets/*'] },
chat: { url: process.env.CHAT_SERVICE_URL || 'http://localhost:3003', routes: ['/chat/*'] },
notificaciones: { url: process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3004', routes: ['/notifications/*'] }
};


export const rateLimits = {
auth: { windowMs: 15 * 60 * 1000, max: 5 },
api: { windowMs: 15 * 60 * 1000, max: 100 }
};