import { useState, useEffect } from 'react';
import { MessageCircle, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/auth/auth.store';
import { socketService } from '@/api/socket.service';
import { ticketsService } from '@/api/tickets.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChatWindow } from './ChatWindow';
import { Message } from '@/api/chat.service';

// Local cn definition as fallback/fix for runtime reference issues
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const GlobalChat = () => {
    const [isOpen, setIsOpen] = useState(false); // Controls Main Ticket List visibility
    const [openTickets, setOpenTickets] = useState<string[]>([]); // Array of open chat IDs
    const [minimizedTickets, setMinimizedTickets] = useState<string[]>([]); // Array of minimized chat IDs
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();
    const [unreadCount, setUnreadCount] = useState(0);

    const toggleMainList = () => {
        setIsOpen(!isOpen);
        if (!isOpen) setUnreadCount(0); // Reset unread on opening list (simplified logic)
    };

    const openChat = (ticketId: string) => {
        if (!openTickets.includes(ticketId)) {
            setOpenTickets([...openTickets, ticketId]);
        }
        // Ensure it's not minimized when opened/clicked
        if (minimizedTickets.includes(ticketId)) {
            setMinimizedTickets(minimizedTickets.filter(id => id !== ticketId));
        }
    };

    const closeChat = (ticketId: string) => {
        setOpenTickets(openTickets.filter(id => id !== ticketId));
        setMinimizedTickets(minimizedTickets.filter(id => id !== ticketId));
    };

    const toggleMinimize = (ticketId: string) => {
        if (minimizedTickets.includes(ticketId)) {
            setMinimizedTickets(minimizedTickets.filter(id => id !== ticketId));
        } else {
            setMinimizedTickets([...minimizedTickets, ticketId]);
        }
    };

    // 1. Load Active Tickets (Assignments + Created)
    const { data: tickets = [], isLoading: loadingTickets } = useQuery({
        queryKey: ['my-active-tickets'],
        queryFn: async () => {
            if (!user?.id) return [];
            const limit = 50;
            const [asignadosRes, creadosRes] = await Promise.allSettled([
                ticketsService.getTickets({ agenteAsignado: user.id, limit }),
                ticketsService.getTickets({ usuarioCreador: user.id, usuarioCreadorEmail: (user as any).email || (user as any).correo, limit })
            ]);
            const asignados = asignadosRes.status === 'fulfilled' ? asignadosRes.value : [];
            const creados = creadosRes.status === 'fulfilled' ? creadosRes.value : [];
            const todos = [...asignados, ...creados];

            // Deduplicate and filter active
            const unicos = todos.filter((ticket, index, self) => {
                const isUnique = index === self.findIndex((t) => t._id === ticket._id);
                if (!isUnique) return false;
                const estado = ticket.estado?.toUpperCase() || '';
                return !['CERRADO', 'RESUELTO'].includes(estado);
            });

            return unicos.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        },
        // enabled: isOpen // Always load to show unread badges? OR load on mount?
        // Let's load on mount to handle incoming message badges correctly ideally, but for now stick to efficient loading
        enabled: true
    });

    // Global Socket Connection (Manager)
    useEffect(() => {
        if (!user) return; // Wait for user

        // Connect global socket (without joining specific room initially, or join ALL active?)
        // In this architecture, GlobalChat manages the connection.
        // ChatWindows rely on query updates.
        // But we need to Listen to ALL active tickets?
        // Or connect to 'user-room'?

        // Strategy: Connect and Join rooms for ALL Open Tickets + Active List?
        // Simplest: Connect once.
        const socket = socketService.connectChat();

        if (socket) {
            // Join rooms for all open tickets
            openTickets.forEach(id => socketService.joinTicketRoom(id));

            const handleNewMessage = (newMessage: Message) => {
                // Play Sound logic (Global)
                const isOwn = typeof newMessage.emisorId === 'object'
                    ? (newMessage.emisorId as any)._id === user?.id
                    : newMessage.emisorId === user?.id;

                if (!isOwn) {
                    try {
                        const audio = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3');
                        audio.volume = 0.5;
                        audio.play().catch(console.error);
                    } catch (e) { console.error(e); }

                    // Increment unread if chat not focused? 
                    // Simplified: just global increment
                    setUnreadCount(prev => prev + 1);
                }

                // Update Cache for specific ticket
                queryClient.setQueryData(['chat', newMessage.ticketId], (old: Message[] = []) => {
                    if (old.some(m => m._id === newMessage._id)) return old;
                    const msgToStore = { ...newMessage };
                    return [...old, msgToStore];
                });

                // Refresh ticket list ordering
                queryClient.invalidateQueries({ queryKey: ['my-active-tickets'] });
            };

            socketService.onNewMessage(handleNewMessage);

            return () => {
                socketService.offNewMessage();
            };
        }
    }, [user, openTickets, queryClient]); // Re-run when openTickets changes to join new rooms?
    // Better: Effect dependent on openTickets to join rooms.

    // Effect to join rooms when openTickets changes
    useEffect(() => {
        if (!user) return;
        openTickets.forEach(id => {
            socketService.joinTicketRoom(id);
        });
    }, [openTickets, user]);


    if (!user) return null;

    return (
        <div className="fixed bottom-0 right-0 z-50 pointer-events-none flex flex-row items-end justify-end p-4 gap-4">
            {/* 
                Layout:
                [Chat Window 2] [Chat Window 1] [Main List] [Button]
                We will map openTickets in REVERSE to stack them leftwards?
                Or Flex-Row-Reverse? 
             */}

            <div className="flex flex-row-reverse items-end gap-4 pointer-events-auto">
                {/* Main Button */}
                <div className="relative flex flex-col items-end">
                    {/* Main List Popover */}
                    {isOpen && (
                        <Card className="mb-4 w-[350px] h-[500px] shadow-2xl border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-200">
                            <CardHeader className="p-3 border-b bg-blue-600 text-white shrink-0">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-base font-semibold">Mensajes</CardTitle>
                                    <span className="text-xs text-blue-100 font-normal">Tus conversaciones activas</span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 p-0 overflow-y-auto bg-white dark:bg-slate-950">
                                {loadingTickets ? (
                                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                                ) : tickets.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full p-6 text-center text-slate-500 gap-4">
                                        <MessageCircle className="h-8 w-8 text-slate-300" />
                                        <p className="text-sm">No hay conversaciones activas</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {tickets.map(ticket => {
                                            const isAssignedToMe = (ticket.agenteAsignado as any)?._id === user?.id || ticket.agenteAsignado === user?.id;
                                            const displayedName = isAssignedToMe
                                                ? (typeof ticket.usuarioCreador === 'object' ? (ticket.usuarioCreador as any)?.nombre : 'Usuario')
                                                : (typeof ticket.agenteAsignado === 'object' ? (ticket.agenteAsignado as any)?.nombre : 'Pendiente');

                                            // Check if already open
                                            const isOpenChat = openTickets.includes(ticket._id!);

                                            return (
                                                <div
                                                    key={ticket._id}
                                                    onClick={() => ticket._id && openChat(ticket._id)}
                                                    className={cn(
                                                        "p-4 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-colors flex gap-3 items-start group",
                                                        isOpenChat && "bg-blue-50 dark:bg-blue-900/10"
                                                    )}
                                                >
                                                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400 font-semibold text-sm">
                                                        {displayedName?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-0.5">
                                                            <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate pr-2 group-hover:text-blue-600 transition-colors">
                                                                {ticket.titulo}
                                                            </h4>
                                                            <span className="text-[10px] text-slate-400 shrink-0">
                                                                {ticket.updatedAt && format(new Date(ticket.updatedAt), 'dd MMM', { locale: es })}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                            {displayedName} • {ticket.estado}
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <Button
                        onClick={toggleMainList}
                        className="h-14 w-14 rounded-full shadow-xl bg-blue-600 hover:bg-blue-700 text-white p-0 flex items-center justify-center transition-all hover:scale-110 relative"
                    >
                        <MessageCircle className="h-7 w-7" />
                        {unreadCount > 0 && !isOpen && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white border-2 border-white dark:border-slate-900 animate-in zoom-in duration-200 z-50">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </Button>
                </div>

                {/* Open Chat Windows */}
                {openTickets.map((ticketId, index) => (
                    <ChatWindow
                        key={ticketId}
                        ticketId={ticketId}
                        onClose={() => closeChat(ticketId)}
                        onMinimize={() => toggleMinimize(ticketId)}
                        isMinimized={minimizedTickets.includes(ticketId)}
                        style={{}} // Flex layout handles positioning
                        positionIndex={index}
                    />
                ))}
            </div>
        </div>
    );
};
