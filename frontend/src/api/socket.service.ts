import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/auth/auth.store';

// URL del Gateway o Notificaciones SVC
// Asumimos que el Gateway expone el socket en el mismo puerto o uno dedicado.
// En desarrollo con Vite proxy, podría ser relativo o directo.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (this.socket?.connected) return;

        const token = useAuthStore.getState().token;
        if (!token) return;

        console.log('[Socket] Connecting to:', SOCKET_URL);

        this.socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
            reconnection: true,
            path: '/socket.io' // Gateway expects /socket.io
        });

        this.socket.on('connect', () => {
            console.log('✅ Socket conectado:', this.socket?.id);
        });

        this.socket.on('connect_error', (err) => {
            console.error('❌ Socket error conexión:', err.message);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // Suscribirse a eventos
    on(event: string, callback: (...args: any[]) => void) {
        this.socket?.on(event, callback);
    }

    off(event: string) {
        this.socket?.off(event);
    }

    // Unirse a salas especificas (ej: chat ticket)
    joinRoom(room: string) {
        this.socket?.emit('join', room);
    }

    leaveRoom(room: string) {
        this.socket?.emit('leave', room);
    }
}

export const socketService = new SocketService();
