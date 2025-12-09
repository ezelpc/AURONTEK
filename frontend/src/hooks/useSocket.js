import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const CHAT_SERVICE_URL = import.meta.env.VITE_CHAT_URL || 'http://localhost:3003';

/**
 * Hook personalizado para conexión Socket.IO
 * Maneja la conexión, reconexión y eventos del chat en tiempo real
 */
export const useSocket = (token) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Crear conexión Socket.IO
    const newSocket = io(CHAT_SERVICE_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Event listeners
    newSocket.on('connect', () => {
      console.log('✅ Socket conectado:', newSocket.id);
      setConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket desconectado:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Error de conexión Socket:', err.message);
      setError(err.message);
      setConnected(false);
    });

    newSocket.on('error', (err) => {
      console.error('❌ Socket error:', err);
      setError(err.message || 'Error desconocido');
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Cleanup al desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token]);

  // Unirse a una sala de ticket
  const joinTicketRoom = useCallback((ticketId) => {
    if (socket && connected) {
      socket.emit('join-ticket-room', ticketId);
      console.log(`📨 Uniéndose a sala del ticket: ${ticketId}`);
    }
  }, [socket, connected]);

  // Enviar mensaje
  const sendMessage = useCallback((ticketId, contenido, tipo = 'texto', metadata = {}) => {
    if (socket && connected) {
      socket.emit('send-message', {
        ticketId,
        contenido,
        tipo,
        metadata
      });
    }
  }, [socket, connected]);

  // Marcar mensaje como leído
  const markAsRead = useCallback((mensajeId, ticketId) => {
    if (socket && connected) {
      socket.emit('mark-as-read', { mensajeId, ticketId });
    }
  }, [socket, connected]);

  // Indicador de "escribiendo..."
  const startTyping = useCallback((ticketId) => {
    if (socket && connected) {
      socket.emit('typing-start', ticketId);
    }
  }, [socket, connected]);

  const stopTyping = useCallback((ticketId) => {
    if (socket && connected) {
      socket.emit('typing-end', ticketId);
    }
  }, [socket, connected]);

  // Escuchar eventos personalizados
  const on = useCallback((event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
  }, [socket]);

  const off = useCallback((event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  }, [socket]);

  return {
    socket,
    connected,
    error,
    joinTicketRoom,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    on,
    off,
  };
};

export default useSocket;
