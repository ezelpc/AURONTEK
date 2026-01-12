import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import { redisPubClient, redisSubClient } from './redis';

let io: Server | null = null;

interface SocketUser {
    id: string;
    nombre: string;
    rol: string;
    empresaId: string;
}

interface AuthenticatedSocket extends Socket {
    user: SocketUser;
}

export const initializeSocketIO = (httpServer: any) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || "*",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Autenticación de Socket.IO
    io.use((socket: Socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                return next(new Error('Token requerido'));
            }

            const secret = process.env.JWT_SECRET || 'secret';
            const decoded: any = jwt.verify(token, secret);

            (socket as AuthenticatedSocket).user = {
                id: decoded.id || decoded.uid,
                nombre: decoded.nombre,
                rol: decoded.rol,
                empresaId: decoded.empresaId
            };

            next();
        } catch (error) {
            next(new Error('Token inválido'));
        }
    });

    // Conexión de usuarios
    io.on('connection', (socket: Socket) => {
        const authSocket = socket as AuthenticatedSocket;
        const userId = authSocket.user.id;

        // Unir al usuario a su sala personal
        socket.join(`user:${userId}`);
        console.log(`✅ Usuario ${userId} conectado a notificaciones`);

        socket.on('disconnect', () => {
            console.log(`❌ Usuario ${userId} desconectado de notificaciones`);
        });
    });

    // Suscribirse a Redis para notificaciones
    if (redisSubClient && redisSubClient.isOpen) {
        redisSubClient.subscribe('notifications', (message: string) => {
            try {
                const data = JSON.parse(message);
                const { targetUserId, ...notificationData } = data;

                if (targetUserId && io) {
                    io.to(`user:${targetUserId}`).emit('nueva-notificacion', notificationData);
                    console.log(`📤 Notificación enviada a usuario ${targetUserId}`);
                }
            } catch (error) {
                console.error('Error procesando notificación de Redis:', error);
            }
        });
        console.log('📡 Suscrito a canal de notificaciones en Redis');
    }

    return io;
};

export const getIO = () => io;
