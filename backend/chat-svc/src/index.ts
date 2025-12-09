import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { initLogger } from './common/logger';
import path from 'path';

// Configuración de entorno
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Importar configuración de DB y Servicios
import connectDB from './Config/ConectionDB';
import chatService from './Services/chat.service';

// Inicializar logger
initLogger();

if (!process.env.JWT_SECRET) dotenv.config();

async function main() {
    const app = express();
    const httpServer = createServer(app);

    interface SocketWithUser extends Socket {
        user?: any;
    }

    const io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || "*",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    await connectDB();

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
            socket.user = decoded;
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

        socket.join(`user:${socket.user.id}`);

        socket.on('join-ticket-room', async (ticketId: string) => {
            if (!ticketId) return;

            try {
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

                const mensaje: any = await chatService.guardarMensaje(mensajeData);

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

        socket.on('mark-as-read', async ({ mensajeId, ticketId }: { mensajeId: string, ticketId: string }) => {
            try {
                await chatService.marcarComoLeido(mensajeId, socket.user.id);
                socket.to(`ticket:${ticketId}`).emit('message-read-update', {
                    mensajeId,
                    usuarioId: socket.user.id
                });
            } catch (error) {
                console.error('Error marcando mensaje:', error);
            }
        });

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
    // API REST
    // ==========================================
    app.use(express.json());

    app.get('/chat/:ticketId/historial', async (req: Request, res: Response) => {
        try {
            const { ticketId } = req.params;
            const { limite, desde } = req.query;

            const authHeader = req.headers.authorization;
            if (!authHeader) return res.status(401).json({ error: 'Token requerido' });

            const token = authHeader.split(' ')[1];
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

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

    app.get('/health', (req: Request, res: Response) => {
        res.json({
            status: 'OK',
            service: 'chat-svc',
            timestamp: new Date().toISOString(),
            connections: io.engine.clientsCount
        });
    });

    const PORT = process.env.CHAT_PORT || 3003;
    httpServer.listen(PORT, () => {
        console.log(`✅ Chat-SVC escuchando en el puerto ${PORT}`);
    });
}

main().catch(error => {
    console.error('❌ Error al iniciar chat-svc:', error);
    process.exit(1);
});