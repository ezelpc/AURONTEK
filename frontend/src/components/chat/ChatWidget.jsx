import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    TextField,
    IconButton,
    Typography,
    Avatar,
    Divider,
    CircularProgress,
    Chip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useSocketContext } from '../../contexts/SocketContext';
import chatService from '../../services/chatService';

/**
 * Componente de chat en tiempo real
 * @param {Object} props
 * @param {string} props.ticketId - ID del ticket
 * @param {Object} props.currentUser - Usuario actual
 */
const ChatWidget = ({ ticketId, currentUser }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [typing, setTyping] = useState(null);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const { socket, connected, joinTicketRoom, sendMessage, on, off } = useSocketContext();

    // Cargar historial al montar
    useEffect(() => {
        const loadHistory = async () => {
            try {
                setLoading(true);
                const historial = await chatService.obtenerHistorial(ticketId);
                setMessages(historial || []);
            } catch (error) {
                console.error('Error cargando historial:', error);
            } finally {
                setLoading(false);
            }
        };

        if (ticketId) {
            loadHistory();
            if (connected) {
                joinTicketRoom(ticketId);
            }
        }
    }, [ticketId, connected, joinTicketRoom]);

    // Escuchar eventos de Socket.IO
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message) => {
            setMessages(prev => [...prev, message]);
            scrollToBottom();
        };

        const handleUserTyping = (data) => {
            if (data.usuarioId !== currentUser?.id) {
                setTyping(data.nombre);
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => setTyping(null), 3000);
            }
        };

        const handleTypingEnd = (data) => {
            if (data.usuarioId !== currentUser?.id) {
                setTyping(null);
            }
        };

        on('new-message', handleNewMessage);
        on('user-typing', handleUserTyping);
        on('user-typing-end', handleTypingEnd);

        return () => {
            off('new-message', handleNewMessage);
            off('user-typing', handleUserTyping);
            off('user-typing-end', handleTypingEnd);
        };
    }, [socket, currentUser, on, off]);

    // Scroll automático
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Enviar mensaje
    const handleSendMessage = async () => {
        if (!newMessage.trim() || sending) return;

        try {
            setSending(true);
            sendMessage(ticketId, newMessage.trim());
            setNewMessage('');
        } catch (error) {
            console.error('Error enviando mensaje:', error);
        } finally {
            setSending(false);
        }
    };

    // Manejar tecla Enter
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Indicador de "escribiendo..."
    const handleTyping = () => {
        if (socket && connected) {
            socket.emit('typing-start', ticketId);

            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('typing-end', ticketId);
            }, 1000);
        }
    };

    // Formatear hora
    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height={400}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">Chat del Ticket</Typography>
                {!connected && (
                    <Chip label="Desconectado" color="error" size="small" sx={{ mt: 1 }} />
                )}
            </Box>

            {/* Mensajes */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                }}
            >
                {messages.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                        No hay mensajes aún. ¡Inicia la conversación!
                    </Typography>
                ) : (
                    messages.map((msg, index) => {
                        const isOwn = msg.emisor?._id === currentUser?.id || msg.emisorId === currentUser?.id;

                        return (
                            <Box
                                key={msg._id || index}
                                sx={{
                                    display: 'flex',
                                    flexDirection: isOwn ? 'row-reverse' : 'row',
                                    gap: 1,
                                    alignItems: 'flex-start',
                                }}
                            >
                                <Avatar
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        bgcolor: isOwn ? 'primary.main' : 'secondary.main',
                                    }}
                                >
                                    {(msg.emisor?.nombre || 'U')[0].toUpperCase()}
                                </Avatar>

                                <Box sx={{ maxWidth: '70%' }}>
                                    <Paper
                                        elevation={1}
                                        sx={{
                                            p: 1.5,
                                            bgcolor: isOwn ? 'primary.light' : 'grey.100',
                                            color: isOwn ? 'primary.contrastText' : 'text.primary',
                                        }}
                                    >
                                        <Typography variant="caption" display="block" fontWeight="bold">
                                            {msg.emisor?.nombre || 'Usuario'}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                                            {msg.contenido}
                                        </Typography>
                                        <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.7 }}>
                                            {formatTime(msg.createdAt || msg.fecha)}
                                        </Typography>
                                    </Paper>
                                </Box>
                            </Box>
                        );
                    })
                )}

                {typing && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        {typing} está escribiendo...
                    </Typography>
                )}

                <div ref={messagesEndRef} />
            </Box>

            <Divider />

            {/* Input */}
            <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
                <TextField
                    fullWidth
                    multiline
                    maxRows={3}
                    placeholder="Escribe un mensaje..."
                    value={newMessage}
                    onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                    }}
                    onKeyPress={handleKeyPress}
                    disabled={!connected || sending}
                    size="small"
                />
                <IconButton color="primary" disabled>
                    <AttachFileIcon />
                </IconButton>
                <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || !connected || sending}
                >
                    {sending ? <CircularProgress size={24} /> : <SendIcon />}
                </IconButton>
            </Box>
        </Paper>
    );
};

export default ChatWidget;
