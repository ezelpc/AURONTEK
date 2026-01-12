import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatService, Message } from '@/api/chat.service';
import { socketService } from '@/api/socket.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/auth/auth.store';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChatWindowProps {
    ticketId: string;
}

export const ChatWindow = ({ ticketId }: ChatWindowProps) => {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);

    // Cargar historial
    const { data: messages = [], isLoading } = useQuery({
        queryKey: ['chat', ticketId],
        queryFn: () => chatService.getHistory(ticketId)
    });

    // Conectar WebSocket y unirse a la sala
    useEffect(() => {
        const socket = socketService.connectChat();
        if (!socket) return;

        socketService.joinTicketRoom(ticketId);

        // Escuchar nuevos mensajes
        const handleNewMessage = (newMessage: Message) => {
            queryClient.setQueryData(['chat', ticketId], (old: Message[] = []) => {
                // Evitar duplicados
                if (old.some(m => m._id === newMessage._id)) return old;
                return [...old, newMessage];
            });
        };

        socketService.onNewMessage(handleNewMessage);

        return () => {
            socketService.offNewMessage();
        };
    }, [ticketId, queryClient]);

    // Auto-scroll al final
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!message.trim() || sending) return;

        setSending(true);
        try {
            // Enviar via WebSocket (más rápido)
            socketService.sendMessage({
                ticketId,
                contenido: message.trim(),
                tipo: 'texto'
            });

            setMessage('');
        } catch (error) {
            console.error('Error enviando mensaje:', error);
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Chat del Ticket</CardTitle>
            </CardHeader>
            <CardContent>
                {/* Mensajes */}
                <div className="h-96 overflow-y-auto mb-4 space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    {messages.length === 0 ? (
                        <div className="text-center text-slate-500 py-8">
                            No hay mensajes aún. ¡Inicia la conversación!
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isOwn = typeof msg.emisorId === 'object'
                                ? msg.emisorId._id === user?.id
                                : msg.emisorId === user?.id;
                            const emisor = typeof msg.emisorId === 'object' ? msg.emisorId : null;

                            return (
                                <div
                                    key={msg._id}
                                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] rounded-lg p-3 ${isOwn
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white dark:bg-slate-800 border'
                                            }`}
                                    >
                                        {!isOwn && emisor && (
                                            <div className="text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">
                                                {emisor.nombre}
                                            </div>
                                        )}
                                        <div className="text-sm whitespace-pre-wrap break-words">
                                            {msg.contenido}
                                        </div>
                                        <div className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-slate-500'}`}>
                                            {format(new Date(msg.createdAt), 'HH:mm', { locale: es })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex gap-2">
                    <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Escribe un mensaje..."
                        disabled={sending}
                    />
                    <Button onClick={handleSend} disabled={!message.trim() || sending}>
                        {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
