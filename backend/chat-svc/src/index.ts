import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { createAdapter } from '@socket.io/redis-adapter';

// Local Imports
import { initLogger } from './common/logger';
import connectDB from './Config/ConectionDB';
import { connectRedis, pubClient, subClient } from './Config/redis';
import chatRoutes from './Routes/chat.routes';
import { socketAuthMiddleware } from './Middleware/socket.auth';
import { setupInternalListener } from './Events/internal.listener';
import { setupSocketHandlers } from './Events/socket.handlers';
import './Models/UsuarioStub'; // Register Usuario model for populate

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

// Inicializar logger
initLogger();

async function main() {
    // 1. Conexiones Base (DB + Redis)
    await connectDB();
    await connectRedis();

    // 2. HTTP Server & Express
    const app = express();
    const httpServer = createServer(app);

    app.use(express.json());

    // Debug Middleware
    app.use((req, res, next) => {
        console.log(`[CHAT-SVC] Received request: ${req.method} ${req.url}`);
        next();
    });

    // Routes
    // Routes
    app.use('/', chatRoutes);
    app.use('/chat', chatRoutes); // Fallback if Gateway sends /chat prefix

    app.get('/health', (req, res) => {
        res.json({ status: 'OK', service: 'chat-svc', timestamp: new Date(), redis: pubClient.isOpen });
    });

    // 3. Socket.IO Setup
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || "*", // Gateway handles this, but Socket.IO needs CORS logic if hitting directly (rare) or via Proxy? 
            // Via proxy, Origin header usually preserved.
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Redis Adapter
    io.adapter(createAdapter(pubClient, subClient));

    // Middlewares & Handlers
    io.use(socketAuthMiddleware);      // Auth & Private Room
    setupInternalListener(io);         // Redis -> Socket Events
    setupSocketHandlers(io);           // Standard Chat Events

    // 4. Start
    const PORT = process.env.CHAT_PORT || 3003;
    httpServer.listen(PORT, () => {
        console.log(`✅ Chat-SVC (Redis+Socket) escuchando en puerto ${PORT}`);
    });
}

main().catch(error => {
    console.error('❌ Error al iniciar chat-svc:', error);
    process.exit(1);
});