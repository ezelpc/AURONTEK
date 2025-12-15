import { Server } from 'socket.io';
import { SocketWithUser } from '../Middleware/socket.auth';
import chatService from '../Services/chat.service';

export const setupSocketHandlers = (io: Server) => {
    io.on('connection', (socket: SocketWithUser) => {
        // console.log(`Cliente conectado: ${socket.user.id} (${socket.user.rol})`);

        // socket.join(`user:${socket.user.id}`); // Already in middleware

        socket.on('join-ticket-room', async (ticketId: string) => {
            if (!ticketId) return;

            try {
                const tieneAcceso = await chatService.validarAcceso(socket.user.id, ticketId);

                if (tieneAcceso) {
                    socket.join(`ticket:${ticketId}`);
                    socket.emit('room-joined', { ticketId, status: 'success' });
                    // console.log(`[Chat] Usuario ${socket.user.id} unido al ticket ${ticketId}`);
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

                // Broadcast a la sala del ticket
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
};
