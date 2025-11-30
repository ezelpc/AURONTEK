import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importar configuración de DB y Servicios
import connectDB from './Config/ConectionDB.js';
import chatService from './Services/chat.service.js';

// Configuración de entorno
dotenv.config({ path: path.join(__dirname, '../.env') });

if (!process.env.JWT_SECRET) dotenv.config(); // Fallback local

const app = express();
const httpServer = createServer(app);

// Extend Socket type to include user property
interface SocketWithUser extends Socket {
    user?: any;
}

// Configurar CORS (Crucial para que el frontend conecte)
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Conectar a MongoDB
connectDB();

// ==========================================
// MIDDLEWARE DE AUTENTICACIÓN SOCKET.IO
// ==========================================
io.use((socket: SocketWithUser, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
        return next(new Error('Autenticación requerida: No se envió token'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        socket.user = decoded; // { id, rol, empresaId, nombre, ... }
        next();
    } catch (error: any) {
        console.error("Error autenticación socket:", error.message);
        next(new Error('Token inválido o expirado'));
    }
});

// ==========================================
// GESTIÓN DE EVENTOS DEL CHAT
// ==========================================
io.on('connection', (socket: SocketWithUser) => {
    console.log(`Cliente conectado: ${socket.user.id} (${socket.user.rol})`);

    // 1. Sala Personal (para notificaciones privadas)
    socket.join(`user:${socket.user.id}`);

    // 2. Unirse a Sala de Ticket (CON VALIDACIÓN DE TUTOR)
    socket.on('join-ticket-room', async (ticketId: string) => {
        if (!ticketId) return;

        try {
            // Aquí el servicio verifica si es Admin, Dueño, Agente o TUTOR
            const tieneAcceso = await chatService.validarAcceso(socket.user.id, ticketId);

            if (tieneAcceso) {
                socket.join(`ticket:${ticketId}`);
                socket.emit('room-joined', { ticketId, status: 'success' });
                console.log(`[Chat] Usuario ${socket.user.id} unido al ticket ${ticketId}`);
            } else {
                console.warn(`[Chat] Acceso denegado a ${socket.user.id} en ticket ${ticketId}`);
                socket.emit('error', { message: 'No tienes permisos para acceder a este chat.' });
            }
        } catch (error) {
            console.error('Error al unirse a sala:', error);
            socket.emit('error', { message: 'Error interno al procesar solicitud.' });
        }
    });

    // 3. Enviar Mensaje
    socket.on('send-message', async (data: any) => {
        try {
            if (!data.ticketId || !data.contenido) return;

            const mensajeData = {
                ticketId: data.ticketId,
                empresaId: socket.user.empresaId || data.empresaId,
                emisorId: socket.user.id,
                tipo: data.tipo || 'texto',
                contenido: data.contenido,
                metadata: data.metadata
            };

            // Guardar mensaje (el servicio re-valida permisos internamente)
            const mensaje: any = await chatService.guardarMensaje(mensajeData);

            // Emitir a todos en la sala del ticket
            io.to(`ticket:${data.ticketId}`).emit('new-message', {
                ...mensaje.toJSON(),
                emisor: {
                    _id: socket.user.id,
                    nombre: socket.user.nombre || 'Usuario',
                    rol: socket.user.rol
                }
            });

        } catch (error: any) {
            console.error('Error enviando mensaje:', error);
            socket.emit('error', { message: 'No se pudo enviar el mensaje', detalle: error.message });
        }
    });

    // 4. Marcar como leído
    socket.on('mark-as-read', async ({ mensajeId, ticketId }: { mensajeId: string, ticketId: string }) => {
        try {
            await chatService.marcarComoLeido(mensajeId, socket.user.id);
            // Notificar a otros que se leyó (opcional, útil para "check azul")
            socket.to(`ticket:${ticketId}`).emit('message-read-update', {
                mensajeId,
                usuarioId: socket.user.id
            });
        } catch (error) {
            console.error('Error marcando mensaje:', error);
        }
    });

    // 5. Indicadores de escritura (Typing...)
    socket.on('typing-start', (ticketId: string) => {
        socket.to(`ticket:${ticketId}`).emit('user-typing', {
            usuarioId: socket.user.id,
            nombre: socket.user.nombre
        });
    });

    socket.on('typing-end', (ticketId: string) => {
        socket.to(`ticket:${ticketId}`).emit('user-typing-end', { usuarioId: socket.user.id });
    });

    socket.on('disconnect', () => {
        // console.log('Cliente desconectado:', socket.user.id);
    });
});

// ==========================================
// API REST (Historial y Utilidades)
// ==========================================
app.use(express.json());

// Endpoint para obtener historial previo al conectar
app.get('/chat/:ticketId/historial', async (req: Request, res: Response) => {
    try {
        const { ticketId } = req.params;
        const { limite, desde } = req.query;

        // Validar Token HTTP
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'Token requerido' });

        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

        // Usar servicio para obtener historial (incluye validación de tutor)
        const mensajes = await chatService.obtenerHistorialChat(ticketId, decoded.id, {
            limite: parseInt(limite as string) || 50,
            desde: desde ? new Date(desde as string) : undefined
        });

        res.json(mensajes);
    } catch (error: any) {
        console.error('Error historial:', error);
        res.status(403).json({ error: error.message || 'Error del servidor' });
    }
});

// Healthcheck
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'OK',
        service: 'chat-svc',
        timestamp: new Date().toISOString(),
        connections: io.engine.clientsCount
    });
});

const PORT = process.env.PORT || 3003;
httpServer.listen(PORT, () => {
    console.log(`Servidor de chat corriendo en puerto ${PORT}`);
});