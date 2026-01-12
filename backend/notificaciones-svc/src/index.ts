import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import path from 'path';
import { connectRabbitMQ } from './config/rabbitmq.config';
import { loadResend } from './config/resend.config';
import { connectRedis } from './config/redis';
import { initLogger } from './common/logger';
import { initializeSocketIO } from './config/socket.config';

// ✅ Cargar variables de entorno solo en desarrollo
const ENV = process.env.NODE_ENV || 'development';

if (ENV === 'development') {
    const rootEnvPath = path.resolve(__dirname, '../../../.env');
    const localEnvPath = path.resolve(__dirname, '../.env');

    dotenv.config({ path: rootEnvPath });
    dotenv.config({ path: localEnvPath });

    console.log(`[${ENV}] 📄 Cargando variables desde archivos .env (Root & Local)`);
    console.log(`[${ENV}] JWT_SECRET Loaded: ${process.env.JWT_SECRET ? 'YES' : 'NO'}`);
}

console.log(`[${ENV}] 🌍 Entorno detectado`);

import mongoose from 'mongoose';
import notificationRoutes from './Routes/notificacion.routes';

async function main() {
    // Inicialización del servidor
    const app = express();
    const httpServer = createServer(app);
    const PORT = process.env.NOTIFICATIONS_PORT || 3004;

    // Middlewares globales
    app.use(express.json());

    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/aurontek';
    try {
        await mongoose.connect(mongoUri);
        console.log('✅ Notificaciones-SVC conectado a MongoDB');
    } catch (err) {
        console.error('❌ Error conectando a MongoDB:', err);
        process.exit(1);
    }

    // Conectar servicios externos
    await loadResend();
    await connectRabbitMQ();
    await connectRedis();

    // Inicializar Socket.IO para notificaciones en tiempo real
    initializeSocketIO(httpServer);
    console.log('✅ Socket.IO inicializado para notificaciones');

    // Inicializar consumidores (importar después de conectar)
    await import('./events/consumer');

    // Healthcheck
    app.get('/health', (req: Request, res: Response) => {
        res.json({
            status: 'OK',
            service: 'notificaciones-svc',
            timestamp: new Date().toISOString()
        });
    });

    // Rutas API (montadas en raíz porque gateway hace el rewrite)
    // Rutas API 
    app.use('/', notificationRoutes);
    app.use('/notificaciones', notificationRoutes); // Fallback

    // Iniciar servidor con Socket.IO
    httpServer.listen(PORT, () => {
        console.log(`✅ Notificaciones-SVC escuchando en el puerto ${PORT}`);
        console.log(`📧 Resend API configurado`);
        console.log(`🐰 RabbitMQ: ${process.env.RABBITMQ_URL}`);
        console.log(`🔌 WebSocket habilitado para notificaciones en tiempo real`);
    });
}

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

main().catch(error => {
    console.error('❌ Error al iniciar notificaciones-svc:', error);
    process.exit(1);
});