import { subClient } from '../Config/redis';
import { Server } from 'socket.io';

export const setupInternalListener = (io: Server) => {
    // Suscribirse a canales
    subClient.subscribe('notifications', (message, channel) => {
        try {
            const data = JSON.parse(message);
            // Payload expected: { targetUserId, type, message, payload, ... }

            if (data.targetUserId) {
                // Emitir a la sala del usuario (manageada por socket.auth.ts)
                io.to(`user:${data.targetUserId}`).emit('notification.new', data);
                // console.log(`[Internal Listener] Notificación enviada a usuario ${data.targetUserId}`);
            } else {
                // Broadcast global? (Optional)
                // io.emit('notification.global', data);
            }
        } catch (error) {
            console.error('[Internal Listener] Error procesando mensaje de Redis:', error);
        }
    });

    console.log('✅ [Chat-SVC] Escuchando eventos internos (Redis)');
};
