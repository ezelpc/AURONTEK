import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/auth/auth.store';
import { chatService, Message } from '@/api/chat.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Loader2 } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ChatWindowProps {
    ticketId: string;
    disabled?: boolean;
}

export function ChatWindow({ ticketId, disabled = false }: ChatWindowProps) {
    const { user, token } = useAuthStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial Load & Socket Connection
    useEffect(() => {
        if (!ticketId || !token) return;

        // 1. Load History
        const loadHistory = async () => {
            try {
                setLoading(true);
                const history = await chatService.getHistory(ticketId);
                setMessages(history);
            } catch (error) {
                console.error('Error loading chat history:', error);
                toast.error('No se pudo cargar el historial del chat');
            } finally {
                setLoading(false);
            }
        };

        loadHistory();

        // 2. Connect Socket
        // Assuming socket.io path is handled by gateway or direct
        // Frontend uses Proxy /socket.io -> Gateway -> Chat Service
        const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

        socketRef.current = io(socketUrl, {
            path: '/socket.io', // Standard Socket.IO path
            auth: {
                token: token
            },
            query: {
                ticketId // Optional context
            }
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('🔌 Chat Socket Connected');
            socket.emit('join-ticket-room', ticketId);
        });

        // Event name mismatch fix: backend emits 'new-message'
        socket.on('new-message', (mensaje: any) => { // Type loose here as backend sends populated object
            // Verificar si es de este ticket (por si acaso)
            if (mensaje.ticketId === ticketId) {
                setMessages(prev => [...prev, mensaje]);
                scrollToBottom();
            }
        });

        socket.on('connect_error', (err) => {
            console.error('Socket Connection Error:', err);
        });

        return () => {
            socket.disconnect();
        };
    }, [ticketId, token]);

    // Auto-scroll on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || sending || disabled || !socketRef.current) return;

        try {
            setSending(true);

            // Use Socket.IO to send message (Real-time broadcast)
            socketRef.current.emit('send-message', {
                ticketId,
                contenido: newMessage.trim(),
                tipo: 'texto'
            });

            // Optimistic Update? 
            // Better to wait for 'new-message' event which comes back from server

            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Error al enviar mensaje');
        } finally {
            setSending(false);
        }
    };

    return (
        <Card className="h-[600px] flex flex-col shadow-md border-t-4 border-t-blue-500">
            <CardHeader className="py-3 px-4 border-b bg-slate-50">
                <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        💬 Chat del Ticket
                        {disabled && <span className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">Lectura</span>}
                    </span>
                    <span className="text-xs font-normal text-slate-500">
                        {messages.length} mensajes
                    </span>
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden bg-slate-50/30">
                {/* Messages Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-slate-400 mt-10">
                            <p>No hay mensajes aún.</p>
                            <p className="text-sm">¡Inicia la conversación!</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = typeof msg.emisorId === 'string'
                                ? msg.emisorId === user?._id
                                : msg.emisorId?._id === user?._id;

                            const senderName = typeof msg.emisorId === 'object' ? msg.emisorId?.nombre : 'Usuario';

                            return (
                                <div
                                    key={msg._id}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <Avatar className="h-8 w-8 mt-1 border">
                                            <AvatarFallback className={isMe ? 'bg-blue-100 text-blue-700' : 'bg-slate-200'}>
                                                {senderName.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div>
                                            {/* Sender Name (only if not me) */}
                                            {!isMe && <div className="text-xs text-slate-500 ml-1 mb-0.5">{senderName}</div>}

                                            <div
                                                className={`p-3 rounded-lg text-sm shadow-sm ${isMe
                                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                                    : 'bg-white border text-slate-800 rounded-tl-none'
                                                    }`}
                                            >
                                                {msg.contenido}
                                            </div>

                                            <div className={`text-[10px] text-slate-400 mt-1 ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Input Area */}
                {!disabled && (
                    <div className="p-3 bg-white border-t">
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Escribe un mensaje..."
                                className="flex-1 focus-visible:ring-blue-500"
                                disabled={sending}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!newMessage.trim() || sending}
                                className="bg-blue-600 hover:bg-blue-700 shrink-0"
                            >
                                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </form>
                    </div>
                )}

                {disabled && (
                    <div className="p-3 bg-slate-100 border-t text-center text-xs text-slate-500">
                        El chat está deshabilitado en este estado.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
