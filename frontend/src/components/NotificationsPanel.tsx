import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificacionesService } from '@/api/notificaciones.service';
import type { Notification } from '@/types/notifications';
import { useAuthStore } from '@/auth/auth.store';
import { 
    Bell, 
    CheckCircle2, 
    AlertCircle, 
    Info, 
    AlertTriangle, 
    Trash2, 
    Eye,
    CheckCheck,
    Clock,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NotificationsPanelProps {
    className?: string;
    maxNotifications?: number;
    refreshInterval?: number;
}

const NotificationsPanel = ({ 
    className = '', 
    maxNotifications = 5,
    refreshInterval = 30000 // 30 segundos
}: NotificationsPanelProps) => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedNotif, setSelectedNotif] = useState<string | null>(null);

    // Fetch notificaciones
    const { 
        data: allNotifications = [] as Notification[], 
        isLoading, 
        refetch 
    } = useQuery<Notification[]>({
        queryKey: ['notificaciones', user?.id],
        queryFn: async () => {
            try {
                const notifs = await notificacionesService.getAll();
                console.log('📬 Notificaciones cargadas:', notifs.length);
                return notifs;
            } catch (error) {
                console.error('Error cargando notificaciones:', error);
                return [];
            }
        },
        enabled: !!user?.id,
        refetchInterval: refreshInterval,
        staleTime: 5000,
    });

    // Marcar como leída
    const markAsReadMutation = useMutation({
        mutationFn: async (id: string) => {
            await notificacionesService.markAsRead(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
        },
        onError: () => {
            toast.error('Error al marcar como leída');
        }
    });

    // Marcar todas como leídas
    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            await notificacionesService.markAllAsRead();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
            toast.success('Todas las notificaciones marcadas como leídas');
        },
        onError: () => {
            toast.error('Error al marcar todas como leídas');
        }
    });

    // Eliminar notificación
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await notificacionesService.delete(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
        },
        onError: () => {
            toast.error('Error al eliminar notificación');
        }
    });

    // Eliminar todas
    const deleteAllMutation = useMutation({
        mutationFn: async () => {
            await notificacionesService.deleteAll();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
            toast.success('Todas las notificaciones eliminadas');
        },
        onError: () => {
            toast.error('Error al eliminar notificaciones');
        }
    });

    // Auto-refetch
    useEffect(() => {
        if (!isOpen) return; // No refetch si no está abierto
        const interval = setInterval(() => refetch(), refreshInterval);
        return () => clearInterval(interval);
    }, [isOpen, refetch, refreshInterval]);

    const unreadCount = allNotifications.filter(n => !n.leida).length;
    const displayNotifications = allNotifications.slice(0, maxNotifications);

    // Icono según tipo
    const getNotificationIcon = (tipo: string) => {
        switch (tipo) {
            case 'success':
                return <CheckCircle2 className="h-5 w-5 text-green-600" />;
            case 'error':
                return <AlertCircle className="h-5 w-5 text-red-600" />;
            case 'warning':
                return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
            default:
                return <Info className="h-5 w-5 text-blue-600" />;
        }
    };

    // Color de fondo según tipo
    const getNotificationBgColor = (tipo: string, leida: boolean) => {
        if (leida) return 'bg-slate-50 hover:bg-slate-100';
        
        switch (tipo) {
            case 'success':
                return 'bg-green-50 hover:bg-green-100';
            case 'error':
                return 'bg-red-50 hover:bg-red-100';
            case 'warning':
                return 'bg-yellow-50 hover:bg-yellow-100';
            default:
                return 'bg-blue-50 hover:bg-blue-100';
        }
    };

    return (
        <div className={cn('relative', className)}>
            {/* Botón campana */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                title="Notificaciones"
                aria-label="Notificaciones"
            >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Panel desplegable */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-slate-200 z-50 max-h-96 overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                        <div>
                            <h3 className="font-semibold text-slate-900">Notificaciones</h3>
                            {unreadCount > 0 && (
                                <p className="text-xs text-slate-600">{unreadCount} sin leer</p>
                            )}
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-slate-200 rounded transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Notificaciones */}
                    <div className="overflow-y-auto flex-1">
                        {isLoading ? (
                            <div className="p-4 text-center text-slate-500">
                                <Clock className="h-5 w-5 animate-spin mx-auto mb-2" />
                                Cargando...
                            </div>
                        ) : allNotifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-slate-500 text-sm">Sin notificaciones</p>
                            </div>
                        ) : (
                            <div className="space-y-2 p-2">
                                {displayNotifications.map((notif) => (
                                    <div
                                        key={notif._id}
                                        className={cn(
                                            'p-3 rounded-lg border border-slate-200 transition-colors cursor-pointer group',
                                            getNotificationBgColor(notif.tipo, notif.leida),
                                            selectedNotif === notif._id && 'ring-2 ring-blue-500'
                                        )}
                                        onClick={() => setSelectedNotif(notif._id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-0.5">
                                                {getNotificationIcon(notif.tipo)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-semibold text-slate-900 truncate">
                                                    {notif.titulo}
                                                </h4>
                                                <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                                                    {notif.mensaje}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {new Date(notif.createdAt).toLocaleDateString('es-ES', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!notif.leida && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            markAsReadMutation.mutate(notif._id);
                                                        }}
                                                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                                                        title="Marcar como leída"
                                                    >
                                                        <Eye className="h-4 w-4 text-blue-600" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteMutation.mutate(notif._id);
                                                    }}
                                                    className="p-1 hover:bg-red-200 rounded transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {allNotifications.length > maxNotifications && (
                                    <div className="p-2 text-center text-xs text-slate-500 border-t border-slate-200 mt-2">
                                        +{allNotifications.length - maxNotifications} más
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer con acciones */}
                    {allNotifications.length > 0 && (
                        <div className="flex gap-2 p-3 border-t border-slate-200 bg-slate-50">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 gap-2"
                                onClick={() => markAllAsReadMutation.mutate()}
                                disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
                            >
                                <CheckCheck className="h-4 w-4" />
                                <span className="hidden sm:inline">Marcar todo</span>
                                <span className="sm:hidden">Todo</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => deleteAllMutation.mutate()}
                                disabled={deleteAllMutation.isPending}
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Limpiar</span>
                                <span className="sm:hidden">Limpiar</span>
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationsPanel;
export { NotificationsPanel };
