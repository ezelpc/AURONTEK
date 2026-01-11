import api from '@/api/axios';
import { Notification, CreateNotificationPayload, NotificationResponse } from '@/types/notifications';

// Re-export tipos para backwards compatibility
export type { Notification, CreateNotificationPayload, NotificationResponse } from '@/types/notifications';

export const notificacionesService = {
    // Obtener todas las notificaciones del usuario actual
    getAll: async (): Promise<Notification[]> => {
        const response = await api.get<Notification[]>('/notificaciones');
        return response.data;
    },

    // Obtener notificaciones con filtros
    getFiltered: async (filters: { limite?: number; leida?: boolean }): Promise<Notification[]> => {
        const params = new URLSearchParams();
        if (filters.limite) params.append('limite', filters.limite.toString());
        if (filters.leida !== undefined) params.append('leida', filters.leida.toString());
        
        const response = await api.get<Notification[]>(`/notificaciones?${params.toString()}`);
        return response.data;
    },

    // Obtener solo notificaciones no leídas
    getUnread: async (): Promise<Notification[]> => {
        const response = await api.get<Notification[]>('/notificaciones?leida=false');
        return response.data;
    },

    // Contar notificaciones no leídas
    countUnread: async (): Promise<number> => {
        const response = await api.get<{ count: number }>('/notificaciones/no-leidas/count');
        return response.data.count;
    },

    // Marcar una notificación como leída
    markAsRead: async (id: string): Promise<void> => {
        await api.patch(`/notificaciones/${id}/leer`);
    },

    // Marcar todas las notificaciones como leídas
    markAllAsRead: async (): Promise<void> => {
        await api.patch('/notificaciones/leer-todas');
    },

    // Eliminar una notificación
    delete: async (id: string): Promise<void> => {
        await api.delete(`/notificaciones/${id}`);
    },

    // Limpiar todas las notificaciones
    deleteAll: async (): Promise<void> => {
        await api.delete('/notificaciones');
    },

    // Crear notificación (normalmente para admin/test, no para usuarios normales)
    create: async (payload: CreateNotificationPayload): Promise<NotificationResponse> => {
        const response = await api.post<NotificationResponse>('/notificaciones/crear', payload);
        return response.data;
    }
};
