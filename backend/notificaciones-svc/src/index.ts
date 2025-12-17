import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import path from 'path';
import { connectRabbitMQ } from './config/rabbitmq.config';
import { loadSMTP } from './config/smtp.config';
import { connectRedis } from './config/redis';
import { initLogger } from './common/logger';

// ✅ Cargar variables de entorno solo en desarrollo
const ENV = process.env.NODE_ENV || 'development';

if (ENV === 'development') {
    const localEnvPath = path.resolve(__dirname, '../.env');
    dotenv.config({ path: localEnvPath });
    console.log(`[${ENV}] 📄 Cargando variables desde .env local`);
}

console.log(`[${ENV}] 🌍 Entorno detectado`);


import mongoose from 'mongoose';
import notificationRoutes from './Routes/notificacion.routes';

// ... imports ...

async function main() {
    // Inicialización del servidor
    const app = express();
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
    await loadSMTP();
    await connectRabbitMQ();
    await connectRedis(); // 🚩 Connect to Redis for Pub/Sub

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

    // Rutas API
    app.use('/', notificationRoutes);

    // Iniciar servidor
    app.listen(PORT, () => {
        console.log(`✅ Notificaciones-SVC escuchando en el puerto ${PORT}`);
        console.log(`📧 SMTP: ${process.env.EMAIL_HOST}`);
        console.log(`🐰 RabbitMQ: ${process.env.RABBITMQ_URL}`);
    });
}

main().catch(error => {
    console.error('❌ Error al iniciar notificaciones-svc:', error);
    process.exit(1);
});