import React, { useState } from 'react';
import { Box, Paper, IconButton, TextField, Typography, List, ListItem, ListItemText, Fab } from '@mui/material';
import { Chat as ChatIcon, Close as CloseIcon, Send as SendIcon, Minimize as MinimizeIcon } from '@mui/icons-material';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';

const FloatingChat = ({ ticketId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { messages, sendMessage, typingUser } = useChat(ticketId); // Only connect if ticketId provided?
    // Note: If ticketId is null, useChat might not join any room? 
    // Or this component is only rendered when inside a Ticket Detail page? 
    // "Floating" usually implies global. If global, what room does it join? "Support"?
    // For now, let's assume it's context-aware or for a specific ticket if passed. 
    // If we want GLOBAL support chat, we need a 'support-room'.
    // User requested "Unified Assistant experience".
    // Let's make it a general support chat if no ticketId, or ticket specific if provided.
    // Simplifying: Render this in TicketDetail first? 
    // Or render globally but only active if needed.
    // Let's build it as a "Ticket Chat" widget first.

    const [input, setInput] = useState('');
    const { user } = useAuth();
    const messagesEndRef = React.useRef(null);

    const handleSend = () => {
        if (!input.trim()) return;
        sendMessage(input);
        setInput('');
    };

    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!ticketId) return null; // Only show if associated with a ticket for now

    return (
        <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
            {!isOpen && (
                <Fab color="primary" onClick={() => setIsOpen(true)}>
                    <ChatIcon />
                </Fab>
            )}

            {isOpen && (
                <Paper sx={{ width: 320, height: 450, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} elevation={10}>
                    {/* Header */}
                    <Box sx={{ p: 1.5, bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" fontWeight="bold">Chat Ticket #{ticketId}</Typography>
                        <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
                            <MinimizeIcon />
                        </IconButton>
                    </Box>

                    {/* Messages */}
                    <Box sx={{ flex: 1, p: 2, overflowY: 'auto', bgcolor: '#f5f5f5' }}>
                        <List dense>
                            {messages.map((msg, i) => {
                                const isMe = msg.emisor?._id === user?.id;
                                return (
                                    <ListItem key={i} sx={{ flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                        <Paper sx={{
                                            p: 1,
                                            maxWidth: '85%',
                                            bgcolor: isMe ? 'primary.light' : 'white',
                                            color: isMe ? 'white' : 'text.primary',
                                            borderRadius: 2
                                        }}>
                                            <Typography variant="body2">{msg.contenido}</Typography>
                                        </Paper>
                                        <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary' }}>
                                            {msg.emisor?.nombre} • {new Date(msg.createdAt || Date.now()).toLocaleTimeString()}
                                        </Typography>
                                    </ListItem>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </List>

                        {typingUser && (
                            <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary', ml: 2 }}>
                                {typingUser} está escribiendo...
                            </Typography>
                        )}
                    </Box>

                    {/* Input */}
                    <Box sx={{ p: 1.5, borderTop: '1px solid #eee', bgcolor: 'white', display: 'flex' }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Escribe un mensaje..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <IconButton color="primary" onClick={handleSend} disabled={!input.trim()}>
                            <SendIcon />
                        </IconButton>
                    </Box>
                </Paper>
            )}
        </Box>
    );
};

export default FloatingChat;
