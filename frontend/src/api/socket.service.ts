import { Socket } from 'socket.io-client';
// import { useAuthStore } from '@/auth/auth.store';

// URL del Gateway o Notificaciones SVC
// Asumimos que el Gateway expone el socket en el mismo puerto o uno dedicado.
// En desarrollo con Vite proxy, podría ser relativo o directo.
// const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:3000');

class SocketService {
    private socket: Socket | null = null;

    connect() {
        // TODO: Habilitar cuando se implemente el chat en tiempo real
        // Por ahora está deshabilitado ya que es trabajo futuro
        console.log('Socket.IO deshabilitado - Chat en tiempo real pendiente de implementación');
        return;

        /* 
        if (this.socket?.connected) return;

        const token = useAuthStore.getState().token;
        if (!token) return;

        this.socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
        });

        this.socket.on('connect', () => {
            console.log('Socket conectado:', this.socket?.id);
        });

        this.socket.on('connect_error', (err) => {
            console.error('Socket error conexión:', err.message);
        });
        */
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
