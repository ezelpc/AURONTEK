import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectRabbitMQ } from './config/rabbitmq.config.js';
import { loadSMTP } from './config/smtp.config.js';
import './events/consumer.js';

// Configuración de rutas absolutas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar el .env desde un nivel superior
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Inicialización del servidor
const app = express();
const PORT = process.env.NOTIFICATIONS_PORT || 3004;

// Middlewares globales
app.use(express.json());

// Conectar servicios externos
await loadSMTP();
await connectRabbitMQ();

// Healthcheck
app.get('/health', (req, res) => {
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