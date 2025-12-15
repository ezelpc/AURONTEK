import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';
import { useNotificationContext } from '../contexts/NotificationContext';

export const useSocket = () => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const { showInfo, showSuccess } = useNotificationContext(); // To show toasts from socket events

    useEffect(() => {
        if (!user) return;

        // Conectar al Gateway (que proxyea /socket.io -> chat-svc)
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const newSocket = io('/', {
            auth: { token },
            path: '/socket.io',
            transports: ['websocket'], // Force websockets to avoid sticky session issues if scaling
            reconnectionAttempts: 5
        });

        newSocket.on('connect', () => {
             console.log('✅ Socket conectado:', newSocket.id);
        });

        newSocket.on('connect_error', (err) => {
            console.error('❌ Error conexión socket:', err.message);
        });

        // Global Listeners (Notifications)
        newSocket.on('notification.new', (data) => {
            console.log('🔔 Nueva notificación socket:', data);
            // Mostrar Toast
            if (data.tipo === 'success') showSuccess(data.titulo);
            else showInfo(data.titulo);
            
            // Dispatch event to update Badge (NotificationContext usually polls, but we can force update if exposed)
            // Or rely on NotificationBell listening to this same socket if we shared the instance via Context.
            
            // To be cleaner: NotificationContext should ideally OWN the socket or listen to it.
            // For now, dispatch window event so NotificationContext can reload?
            window.dispatchEvent(new CustomEvent('notification:reload'));
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user?.id]); // Re-connect if user changes

    return { socket };
};
