import { Socket, io } from 'socket.io-client';
import { useAuthStore } from '@/auth/auth.store';

class SocketService {
    private chatSocket: Socket | null = null;
    private notificationsSocket: Socket | null = null;

    private currentToken: string | null = null;

    // Conectar al servicio de chat
    connectChat() {
        const token = useAuthStore.getState().token;
        if (!token) return null;

        // Si ya está conectado con EL MISMO token, retornar socket existente
        if (this.chatSocket?.connected && this.currentToken === token) {
            return this.chatSocket;
        }

        // Si hay cambio de token o desconexión, limpiar anterior
        if (this.chatSocket) {
            console.log('[Chat Socket] Token changed or reconnecting, disconnecting old socket...');
            this.disconnect();
        }

        this.currentToken = token;

        const CHAT_URL = import.meta.env.VITE_CHAT_URL || 'http://localhost:3003';
        console.log('[Chat Socket] Connecting to:', CHAT_URL);

        this.chatSocket = io(CHAT_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true
        });

        this.chatSocket.on('connect', () => {
            console.log('✅ Chat socket conectado:', this.chatSocket?.id);
        });

        this.chatSocket.on('connect_error', (err) => {
            console.error('❌ Chat socket error:', err.message);
        });

        return this.chatSocket;
    }

    // Conectar al servicio de notificaciones
    connectNotifications() {
        const token = useAuthStore.getState().token;
        if (!token) return null;

        if (this.notificationsSocket?.connected && this.currentToken === token) {
            return this.notificationsSocket;
        }

        if (this.notificationsSocket) {
            this.notificationsSocket.disconnect();
        }
        // Note: currentToken is mostly managed by connectChat, but we use same token.

        const NOTIF_URL = import.meta.env.VITE_NOTIFICATIONS_URL || 'http://localhost:3004';
        console.log('[Notifications Socket] Connecting to:', NOTIF_URL);

        this.notificationsSocket = io(NOTIF_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true
        });

        this.notificationsSocket.on('connect', () => {
            console.log('✅ Notifications socket conectado:', this.notificationsSocket?.id);
        });

        this.notificationsSocket.on('connect_error', (err) => {
            console.error('❌ Notifications socket error:', err.message);
        });

        return this.notificationsSocket;
    }

    // Desconectar ambos sockets
    disconnect() {
        if (this.chatSocket) {
            this.chatSocket.disconnect();
            this.chatSocket = null;
        }
        if (this.notificationsSocket) {
            this.notificationsSocket.disconnect();
            this.notificationsSocket = null;
        }
    }

    // Obtener socket de chat
    getChatSocket() {
        return this.chatSocket;
    }

    // Obtener socket de notificaciones
    getNotificationsSocket() {
        return this.notificationsSocket;
    }

    // Métodos de chat
    joinTicketRoom(ticketId: string) {
        console.log('[Chat Socket] Joining room:', ticketId);
        console.log('[Chat Socket] Socket connected:', this.chatSocket?.connected);
        this.chatSocket?.emit('join-ticket-room', ticketId);
    }

    sendMessage(data: { ticketId: string; contenido: string; tipo?: string; metadata?: any; empresaId?: string }) {
        console.log('[Chat Socket] Sending message:', data);
        console.log('[Chat Socket] Socket connected:', this.chatSocket?.connected);
        if (!this.chatSocket?.connected) {
            console.error('[Chat Socket] Socket not connected!');
            return;
        }
        this.chatSocket.emit('send-message', data);
    }

    onNewMessage(callback: (message: any) => void) {
        console.log('[Chat Socket] Listening for new messages');
        this.chatSocket?.on('new-message', callback);
    }

    offNewMessage() {
        this.chatSocket?.off('new-message');
    }

    // Métodos de notificaciones
    onNewNotification(callback: (notification: any) => void) {
        this.notificationsSocket?.on('nueva-notificacion', callback);
    }

    offNewNotification() {
        this.notificationsSocket?.off('nueva-notificacion');
    }
}

export const socketService = new SocketService();
