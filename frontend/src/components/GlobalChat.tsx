import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, ChevronLeft, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/auth/auth.store';
import { socketService } from '@/api/socket.service';
import { chatService, Message } from '@/api/chat.service';
import { ticketsService } from '@/api/tickets.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export const GlobalChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const user = useAuthStore((state) => state.user);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();
    const [unreadCount, setUnreadCount] = useState(0);

    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen) setUnreadCount(0); // Reset on open
    };

    // 1. Cargar lista de tickets activos (conversaciones)
    const { data: tickets = [], isLoading: loadingTickets } = useQuery({
        queryKey: ['my-active-tickets'],
        queryFn: async () => {
            if (!user?.id) return [];

            // Quitamos estado: 'abierto' para filtrar en cliente y evitar case mismatch
            const limit = 50;
            // UPDATE: Admin needs explicit filtering to mimic "My Tickets" view found in Company Dashboard
            const [asignadosRes, creadosRes] = await Promise.allSettled([
                ticketsService.getTickets({ agenteAsignado: user.id, limit }),
                ticketsService.getTickets({ usuarioCreador: user.id, usuarioCreadorEmail: (user as any).email || (user as any).correo, limit })
            ]);

            const asignados = asignadosRes.status === 'fulfilled' ? asignadosRes.value : [];
            const creados = creadosRes.status === 'fulfilled' ? creadosRes.value : [];

            const todos = [...asignados, ...creados];

            // Eliminar duplicados y filtrar por estado activo (normalizado)
            const unicos = todos.filter((ticket, index, self) => {
                const isUnique = index === self.findIndex((t) => t._id === ticket._id);
                if (!isUnique) return false;

                const estado = ticket.estado?.toUpperCase() || '';
                // Considerar activos: ABIERTO, EN_PROCESO, PENDIENTE
                return !['CERRADO', 'RESUELTO'].includes(estado);
            });

            // Ordenar por fecha de actualización (más reciente primero)
            return unicos.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        },
        enabled: isOpen && !activeTicketId
    });

    // 2. Cargar mensajes del ticket activo (con diagnóstico de error)
    const { data: messages = [], isLoading: loadingMessages, error: chatError } = useQuery({
        queryKey: ['chat', activeTicketId],
        queryFn: async () => {
            if (!activeTicketId) return [];
            console.log('[GlobalChat] Loading history for:', activeTicketId);
            try {
                return await chatService.getHistory(activeTicketId);
            } catch (err: any) {
                console.error('[GlobalChat] Error loading history:', err);
                const status = err.response?.status;
                const msg = err.response?.data?.error || err.message;
                // Devolvemos error con info útil
                throw new Error(status ? `Error ${status}: ${msg}` : msg);
            }
        },
        enabled: !!activeTicketId,
        retry: 1
    });

    // Conexión Socket
    useEffect(() => {
        if (!isOpen || !activeTicketId) return;

        console.log('[GlobalChat] Connecting socket for ticket:', activeTicketId);
        const socket = socketService.connectChat();

        if (socket) {
            socketService.joinTicketRoom(activeTicketId);

            const handleNewMessage = (newMessage: Message) => {
                console.log('[GlobalChat] New message received:', newMessage);

                // Play Sound if message is from OTHER
                const isOwn = typeof newMessage.emisorId === 'object'
                    ? (newMessage.emisorId as any)._id === user?.id
                    : newMessage.emisorId === user?.id;

                if (!isOwn) {
                    try {
                        const audio = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3');
                        audio.volume = 0.5;
                        if (audio) {
                            audio.play().catch(err => console.log('Audio play failed (interaction required?):', err));
                        }
                    } catch (e) {
                        console.error('Audio error:', e);
                    }

                    if (!isOpen) {
                        setUnreadCount(prev => prev + 1);
                    }
                }

                queryClient.setQueryData(['chat', activeTicketId], (old: Message[] = []) => {
                    if (old.some(m => m._id === newMessage._id)) return old;
                    return [...old, newMessage];
                });

                // Invalidate queries to refresh list/history
                queryClient.invalidateQueries({ queryKey: ['my-active-tickets'] });
                if (newMessage.ticketId === activeTicketId) {
                    queryClient.invalidateQueries({ queryKey: ['chat', activeTicketId] });
                }
            };

            socketService.onNewMessage(handleNewMessage);

            return () => {
                socketService.offNewMessage();
            };
        }
    }, [isOpen, activeTicketId, queryClient]);

    // Auto-scroll
    useEffect(() => {
        if (activeTicketId) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, activeTicketId, isOpen]);

    const handleSend = () => {
        if (!message.trim() || !activeTicketId) return;

        console.log('[GlobalChat] Sending message to:', activeTicketId);
        socketService.sendMessage({
            ticketId: activeTicketId,
            contenido: message.trim(),
            tipo: 'texto'
        });
        setMessage('');
    };

    if (!user) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none">
            {/* Contenedor principal con pointer-events-auto para interactuar */}
            <div className="pointer-events-auto flex flex-col items-end space-y-4">

                {/* Ventana de Chat */}
                {isOpen && (
                    <Card className="w-[350px] h-[500px] shadow-2xl border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-200">
                        {/* Header */}
                        <CardHeader className="p-3 border-b bg-blue-600 text-white shrink-0">
                            <div className="flex items-center gap-2">
                                {activeTicketId && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-white hover:bg-blue-700 hover:text-white -ml-2"
                                        onClick={() => setActiveTicketId(null)}
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </Button>
                                )}
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex flex-col">
                                        <CardTitle className="text-base font-semibold truncate leading-none">
                                            {activeTicketId
                                                ? (() => {
                                                    const t = tickets.find(t => t._id === activeTicketId);
                                                    if (!t) return 'Chat de Ticket';

                                                    const isAssignedToMe = (t.agenteAsignado as any)?._id === user?.id || t.agenteAsignado === user?.id;
                                                    const displayedName = isAssignedToMe
                                                        ? (typeof t.usuarioCreador === 'object' ? (t.usuarioCreador as any)?.nombre : 'Usuario')
                                                        : (typeof t.agenteAsignado === 'object' ? (t.agenteAsignado as any)?.nombre : 'Pendiente');

                                                    return displayedName ? `${t.titulo} • ${displayedName}` : t.titulo;
                                                })()
                                                : 'Mensajes'
                                            }
                                        </CardTitle>
                                    </div>
                                    {!activeTicketId && (
                                        <span className="text-xs text-blue-100 font-normal">Tus conversaciones activas</span>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-white hover:bg-blue-700 hover:text-white"
                                    onClick={toggleChat}
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 p-0 overflow-hidden bg-white dark:bg-slate-950 relative">
                            {/* VISTA 1: Lista de Tickets (Conversaciones) */}
                            {!activeTicketId && (
                                <div className="h-full overflow-y-auto">
                                    {loadingTickets ? (
                                        <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-500">
                                            <Loader2 className="animate-spin h-6 w-6" />
                                            <span className="text-xs">Cargando conversaciones...</span>
                                        </div>
                                    ) : tickets.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full p-6 text-center text-slate-500 gap-4">
                                            <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-full">
                                                <MessageCircle className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm mb-1">No hay conversaciones</p>
                                                <p className="text-xs text-slate-500">
                                                    No tienes tickets activos (creados o asignados).
                                                </p>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/tickets'}>
                                                Ver todos los tickets
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {tickets.map(ticket => {
                                                const isAssignedToMe = (ticket.agenteAsignado as any)?._id === user?.id || ticket.agenteAsignado === user?.id;
                                                const displayedName = isAssignedToMe
                                                    ? (typeof ticket.usuarioCreador === 'object' ? (ticket.usuarioCreador as any)?.nombre : 'Usuario')
                                                    : (typeof ticket.agenteAsignado === 'object' ? (ticket.agenteAsignado as any)?.nombre : 'Pendiente');

                                                return (
                                                    <div
                                                        key={ticket._id}
                                                        onClick={() => ticket._id && setActiveTicketId(ticket._id)}
                                                        className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-colors flex gap-3 items-start group"
                                                    >
                                                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400 font-semibold text-sm">
                                                            {displayedName?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start mb-0.5">
                                                                <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate pr-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                                    {ticket.titulo}
                                                                </h4>
                                                                <span className="text-[10px] text-slate-400 shrink-0">
                                                                    {ticket.updatedAt && format(new Date(ticket.updatedAt), 'dd MMM', { locale: es })}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                                #{ticket.id?.slice(-4)} • CrID: {(typeof ticket.usuarioCreador === 'object' ? (ticket.usuarioCreador as any)?._id : ticket.usuarioCreador)?.slice(-4)}
                                                            </p>
                                                            <div className="mt-1.5 flex gap-1.5">
                                                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-slate-100 text-slate-600">
                                                                    {ticket.estado}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* VISTA 2: Chat Activo */}
                            {activeTicketId && (
                                <div className="flex flex-col h-full">
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-900/50">
                                        {loadingMessages ? (
                                            <div className="flex justify-center py-8">
                                                <Loader2 className="animate-spin h-6 w-6 text-blue-500" />
                                            </div>
                                        ) : chatError ? (
                                            <div className="flex flex-col items-center justify-center h-full text-center p-4 gap-2">
                                                <AlertCircle className="h-8 w-8 text-red-500 opacity-50" />
                                                <div className="text-center">
                                                    <p className="text-red-500 font-medium text-sm">Error al cargar historial</p>
                                                    <p className="text-xs text-slate-400 mt-1 max-w-[200px] break-words">
                                                        {(chatError as Error).message}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-2"
                                                    onClick={() => queryClient.invalidateQueries({ queryKey: ['chat', activeTicketId] })}
                                                >
                                                    Reintentar
                                                </Button>
                                            </div>
                                        ) : messages.length === 0 ? (
                                            <div className="text-center text-xs text-slate-400 mt-8">
                                                Inicio de la conversación.
                                            </div>
                                        ) : (
                                            messages.map((msg) => {
                                                const isOwn = (msg.emisorId && typeof msg.emisorId === 'object')
                                                    ? (msg.emisorId as any)._id === user?.id
                                                    : msg.emisorId === user?.id;

                                                const senderName = (msg.emisorId && typeof msg.emisorId === 'object')
                                                    ? (msg.emisorId as any).nombre
                                                    : 'Usuario';

                                                return (
                                                    <div key={msg._id} className={cn("flex flex-col mb-2", isOwn ? "items-end" : "items-start")}>
                                                        {/* Sender Name */}
                                                        {!isOwn && (
                                                            <span className="text-[10px] text-slate-500 ml-1 mb-0.5 font-medium">
                                                                {senderName}
                                                            </span>
                                                        )}

                                                        <div className={cn(
                                                            "max-w-[85%] rounded-2xl px-3 py-2 text-sm break-words shadow-sm",
                                                            isOwn
                                                                ? "bg-blue-600 text-white rounded-br-sm"
                                                                : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-sm"
                                                        )}>
                                                            {msg.contenido}
                                                        </div>
                                                        <span className={cn(
                                                            "text-[10px] text-slate-400 mt-0.5 px-1 select-none",
                                                            isOwn ? "text-right" : "text-left"
                                                        )}>
                                                            {format(new Date(msg.createdAt), 'HH:mm', { locale: es })}
                                                        </span>
                                                    </div>
                                                );
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Input Area */}
                                    <div className="p-3 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex gap-2 items-end">
                                        <Input
                                            value={message}
                                            onChange={e => setMessage(e.target.value)}
                                            className="min-h-[40px] max-h-[100px] text-sm bg-slate-50 dark:bg-slate-900 border-0 focus-visible:ring-1 focus-visible:ring-blue-500 resize-none"
                                            placeholder="Escribe un mensaje..."
                                            onKeyPress={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                                        />
                                        <Button
                                            size="icon"
                                            className="h-10 w-10 shrink-0 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                            onClick={handleSend}
                                            disabled={!message.trim()}
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Botón Flotante Principal */}
                {!isOpen && (
                    <Button
                        onClick={toggleChat}
                        className="h-14 w-14 rounded-full shadow-xl bg-blue-600 hover:bg-blue-700 text-white p-0 flex items-center justify-center transition-all hover:scale-110 hover:shadow-2xl active:scale-95 relative"
                    >
                        <MessageCircle className="h-7 w-7" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white dark:border-slate-900 animate-in zoom-in duration-200">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
};
