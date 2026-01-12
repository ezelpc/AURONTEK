import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsService, Notification } from '@/api/notifications.service';
import { socketService } from '@/api/socket.service';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export const NotificationsDropdown = () => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Obtener notificaciones
    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => notificationsService.getAll(undefined, 10),
        refetchInterval: open ? 5000 : false // Refetch mientras está abierto
    });

    // Contar no leídas
    const { data: unreadCount = 0 } = useQuery({
        queryKey: ['notifications-unread-count'],
        queryFn: notificationsService.getUnreadCount,
        refetchInterval: 30000 // Cada 30 segundos
    });

    // Conectar WebSocket para notificaciones en tiempo real
    useEffect(() => {
        const socket = socketService.connectNotifications();
        if (!socket) return;

        const handleNewNotification = (notification: Notification) => {
            // Agregar a la lista
            queryClient.setQueryData(['notifications'], (old: Notification[] = []) => {
                return [notification, ...old];
            });

            // Incrementar contador
            queryClient.setQueryData(['notifications-unread-count'], (old: number = 0) => old + 1);

            // Mostrar toast o sonido (opcional)
            console.log('📬 Nueva notificación:', notification.titulo);
        };

        socketService.onNewNotification(handleNewNotification);

        return () => {
            socketService.offNewNotification();
        };
    }, [queryClient]);

    const handleMarkAsRead = async (notification: Notification) => {
        if (notification.leida) return;

        try {
            await notificationsService.markAsRead(notification._id);
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        } catch (error) {
            console.error('Error marcando como leída:', error);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        await handleMarkAsRead(notification);

        // Navegar si tiene ticketId
        if (notification.metadata?.ticketId) {
            navigate(`/empresa/tickets/${notification.metadata.ticketId}`);
            setOpen(false);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsService.markAllAsRead();
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        } catch (error) {
            console.error('Error marcando todas como leídas:', error);
        }
    };

    const getNotificationIcon = (tipo: Notification['tipo']) => {
        switch (tipo) {
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            default: return 'ℹ️';
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notificaciones</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="text-xs"
                        >
                            Marcar todas como leídas
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-sm">
                            No tienes notificaciones
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification._id}
                                className={`flex flex-col items-start p-3 cursor-pointer ${!notification.leida ? 'bg-blue-50 dark:bg-blue-950' : ''
                                    }`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="flex items-start gap-2 w-full">
                                    <span className="text-lg">{getNotificationIcon(notification.tipo)}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-sm truncate">
                                            {notification.titulo}
                                        </div>
                                        <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                                            {notification.mensaje}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            {formatDistanceToNow(new Date(notification.createdAt), {
                                                addSuffix: true,
                                                locale: es
                                            })}
                                        </div>
                                    </div>
                                    {!notification.leida && (
                                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                                    )}
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
