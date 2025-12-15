import { useEffect, useState, useCallback, useRef } from 'react';
import { useSocketContext } from '../contexts/SocketContext';
import { useAuth } from './useAuth';

export const useChat = (ticketId) => {
    const { socket } = useSocketContext();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState(null);

    // Join Room
    useEffect(() => {
        if (!socket || !ticketId || !user) return;

        socket.emit('join-ticket-room', ticketId);

        const handleRoomJoined = (data) => {
            if(data.ticketId === ticketId) {
                // console.log('Joined room:', ticketId);
            }
        };

        const handleNewMessage = (msg) => {
            if (msg.ticketId === ticketId) {
                setMessages(prev => [...prev, msg]);
            }
        };

        const handleUserTyping = (data) => {
            setTypingUser(data.nombre);
            setTimeout(() => setTypingUser(null), 3000);
        };

        socket.on('room-joined', handleRoomJoined);
        socket.on('new-message', handleNewMessage);
        socket.on('user-typing', handleUserTyping);

        return () => {
            socket.off('room-joined', handleRoomJoined);
            socket.off('new-message', handleNewMessage);
            socket.off('user-typing', handleUserTyping);
        };
    }, [socket, ticketId, user]);


    const sendMessage = useCallback((contenido, tipo = 'texto') => {
        if (!socket) return;
        socket.emit('send-message', {
            ticketId,
            contenido,
            tipo,
            // empresaId: user.empresaId // Backend lo saca del token
        });
    }, [socket, ticketId]);

    const sendTyping = useCallback(() => {
        if(!socket) return;
        socket.emit('typing-start', ticketId);
    }, [socket, ticketId]);

    return { 
        messages, 
        sendMessage, 
        sendTyping,
        typingUser,
        isConnected: !!socket 
    };
};
