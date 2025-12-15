import { createApp } from './app';
import { connectRedis } from './config/redis';
import dotenv from 'dotenv';
import path from 'path';
import { initLogger } from './common/logger';

// Cargar .env desde AURONTEK/.env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
// Inicializar logger lo antes posible para controlar console.* según la rama
initLogger();

const PORT = process.env.GATEWAY_PORT || 3000;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const startServer = async () => {
    // 1. Conectar a Redis PRIMERO
    await connectRedis();

    // 2. Inicializar la App (esto crea los Rate Limiters que dependen de Redis)
    const app = createApp();

    // 3. Iniciar el Servidor
    app.listen(PORT, () => {
        console.log(`🚀 API Gateway corriendo en el puerto ${PORT}`);
        console.log(`🔗 Redis URL: ${REDIS_URL}`);
    });
};

startServer().catch(err => {
    console.error('💀 Error fatal al iniciar el Gateway:', err);
    process.exit(1);
});