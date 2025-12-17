import { useState, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { socketService } from '@/api/socket.service';
import { notificacionesService, Notification } from '@/api/notificaciones.service';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const NotificationsMenu = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch initial notifications from backend
    const { data: initialNotifications } = useQuery({
        queryKey: ['notifications'],
        queryFn: notificacionesService.getAll,
        onSuccess: (data) => {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.leida).length);
        }
    });

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: notificacionesService.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
        onError: () => {
            toast.error('Error al marcar como leída');
        }
    });

    // Mark all as read mutation
    const markAllAsReadMutation = useMutation({
        mutationFn: notificacionesService.markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
            setUnreadCount(0);
            toast.success('Todas las notificaciones marcadas como leídas');
        },
        onError: () => {
            toast.error('Error al marcar todas como leídas');
        }
    });

    // Delete notification mutation
    const deleteNotificationMutation = useMutation({
        mutationFn: notificacionesService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
        onError: () => {
            toast.error('Error al eliminar notificación');
        }
    });

    // Clear all notifications mutation
    const clearAllMutation = useMutation({
        mutationFn: notificacionesService.deleteAll,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            setNotifications([]);
            setUnreadCount(0);
            toast.success('Todas las notificaciones eliminadas');
        },
        onError: () => {
            toast.error('Error al limpiar notificaciones');
        }
    });

    useEffect(() => {
        socketService.connect();

        const handleNotification = (payload: any) => {
            const newNotif: Notification = {
                _id: payload._id || Math.random().toString(36).substr(2, 9),
                usuarioId: payload.usuarioId || '',
                titulo: payload.titulo,
                mensaje: payload.mensaje,
                tipo: payload.tipo || 'info',
                leida: false,
                link: payload.link,
                metadata: payload.metadata,
                createdAt: new Date().toISOString()
            };

            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Show toast notification
            toast.info(payload.titulo, {
                description: payload.mensaje
            });
        };

        socketService.on('notificacion', handleNotification);

        return () => {
            socketService.off('notificacion', handleNotification);
        };
    }, []);

    const markAsRead = (id: string) => {
        // Update local state immediately for better UX
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, leida: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        // Persist to backend
        markAsReadMutation.mutate(id);
    };

    const markAllAsRead = () => {
        markAllAsReadMutation.mutate();
    };

    const deleteNotification = (id: string) => {
        // Update local state immediately
        setNotifications(prev => {
            const notif = prev.find(n => n._id === id);
            if (notif && !notif.leida) {
                setUnreadCount(c => Math.max(0, c - 1));
            }
            return prev.filter(n => n._id !== id);
        });

        // Persist to backend
        deleteNotificationMutation.mutate(id);
    };

    const clearAll = () => {
        clearAllMutation.mutate();
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.leida) {
            markAsRead(notification._id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const getNotificationIcon = (tipo: string) => {
        switch (tipo) {
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            default: return 'ℹ️';
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex justify-between items-center">
                    <span>Notificaciones</span>
                    {notifications.length > 0 && (
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={markAllAsRead}
                                disabled={unreadCount === 0}
                            >
                                <Check className="h-3 w-3 mr-1" />
                                Marcar todas
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-red-500 hover:text-red-700"
                                onClick={clearAll}
                            >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Limpiar
                            </Button>
                        </div>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-sm">
                            No tienes notificaciones
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <DropdownMenuItem
                                key={notif._id}
                                className={cn(
                                    "flex flex-col items-start p-3 cursor-pointer",
                                    !notif.leida && "bg-blue-50 hover:bg-blue-100"
                                )}
                                onClick={() => handleNotificationClick(notif)}
                            >
                                <div className="flex justify-between w-full items-start">
                                    <div className="flex gap-2 flex-1">
                                        <span className="text-lg">{getNotificationIcon(notif.tipo)}</span>
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{notif.titulo}</div>
                                            <div className="text-xs text-slate-600 mt-1">{notif.mensaje}</div>
                                            <div className="text-xs text-slate-400 mt-1">
                                                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        {!notif.leida && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead(notif._id);
                                                }}
                                            >
                                                <Check className="h-3 w-3 text-green-600" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(notif._id);
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
