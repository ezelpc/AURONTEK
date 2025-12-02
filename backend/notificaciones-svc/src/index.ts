import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import path from 'path';
import { connectRabbitMQ } from './config/rabbitmq.config';
import { loadSMTP } from './config/smtp.config';
import { initLogger } from './common/logger';

// Cargar el .env desde AURONTEK/.env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Inicializar logger según rama
initLogger();

async function main() {
    // Inicialización del servidor
    const app = express();
    const PORT = process.env.NOTIFICATIONS_PORT || 3004;

    // Middlewares globales
    app.use(express.json());

    // Conectar servicios externos
    await loadSMTP();
    await connectRabbitMQ();

    // Inicializar consumidores (importar después de conectar)
    await import('./Events/consumer');

    // Healthcheck
    app.get('/health', (req: Request, res: Response) => {
        res.json({
            status: 'OK',
            service: 'notificaciones-svc',
            timestamp: new Date().toISOString()
        });
    });

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