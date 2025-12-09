import React, { useState } from 'react';
import {
    Fab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    Avatar,
    IconButton,
    Chip,
    CircularProgress,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import iaService from '../../services/iaService';

/**
 * Asistente IA flotante
 * @param {Object} props
 * @param {Object} props.contexto - Contexto adicional para la IA
 */
const IAAssistant = ({ contexto = {} }) => {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: '¡Hola! Soy tu asistente IA. ¿En qué puedo ayudarte hoy?',
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [iaStatus, setIaStatus] = useState(null);

    // Verificar estado de IA al abrir
    const handleOpen = async () => {
        setOpen(true);
        try {
            const status = await iaService.obtenerEstadoIA();
            setIaStatus(status);
        } catch (error) {
            console.error('Error obteniendo estado de IA:', error);
            setIaStatus({ status: 'error' });
        }
    };

    // Enviar mensaje a IA
    const handleSendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = {
            role: 'user',
            content: input.trim(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await iaService.consultarIA(input.trim(), contexto);

            const assistantMessage = {
                role: 'assistant',
                content: response || 'Lo siento, no pude procesar tu solicitud.',
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error consultando IA:', error);

            const errorMessage = {
                role: 'assistant',
                content: 'Lo siento, hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.',
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    // Manejar Enter
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Sugerencias rápidas
    const quickSuggestions = [
        '¿Cómo clasifico un ticket?',
        '¿Qué agente debería asignar?',
        'Ayúdame con este ticket',
        'Explica las prioridades',
    ];

    const handleQuickSuggestion = (suggestion) => {
        setInput(suggestion);
    };

    return (
        <>
            {/* Botón flotante */}
            <Fab
                color="secondary"
                aria-label="asistente-ia"
                onClick={handleOpen}
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 1000,
                }}
            >
                <SmartToyIcon />
            </Fab>

            {/* Dialog del chat */}
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { height: '80vh', maxHeight: 600 }
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                        <SmartToyIcon />
                    </Avatar>
                    <Box flex={1}>
                        <Typography variant="h6">Asistente IA</Typography>
                        {iaStatus && (
                            <Chip
                                label={iaStatus.status === 'healthy' ? 'En línea' : 'Fuera de línea'}
                                color={iaStatus.status === 'healthy' ? 'success' : 'error'}
                                size="small"
                                icon={<AutoAwesomeIcon />}
                            />
                        )}
                    </Box>
                    <IconButton onClick={() => setOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
                    {/* Mensajes */}
                    <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {messages.map((msg, index) => (
                            <Box
                                key={index}
                                sx={{
                                    display: 'flex',
                                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                }}
                            >
                                <Paper
                                    elevation={1}
                                    sx={{
                                        p: 2,
                                        maxWidth: '80%',
                                        bgcolor: msg.role === 'user' ? 'primary.light' : 'grey.100',
                                        color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                                    }}
                                >
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                        {msg.content}
                                    </Typography>
                                </Paper>
                            </Box>
                        ))}

                        {loading && (
                            <Box display="flex" alignItems="center" gap={1}>
                                <CircularProgress size={20} />
                                <Typography variant="body2" color="text.secondary">
                                    Pensando...
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Sugerencias rápidas */}
                    {messages.length === 1 && (
                        <Box>
                            <Typography variant="caption" color="text.secondary" gutterBottom>
                                Sugerencias rápidas:
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                                {quickSuggestions.map((suggestion, index) => (
                                    <Chip
                                        key={index}
                                        label={suggestion}
                                        onClick={() => handleQuickSuggestion(suggestion)}
                                        size="small"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <TextField
                        fullWidth
                        multiline
                        maxRows={3}
                        placeholder="Escribe tu pregunta..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={loading}
                        size="small"
                    />
                    <IconButton
                        color="primary"
                        onClick={handleSendMessage}
                        disabled={!input.trim() || loading}
                    >
                        <SendIcon />
                    </IconButton>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default IAAssistant;
