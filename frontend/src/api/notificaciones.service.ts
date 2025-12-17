import api from '@/api/axios';

export interface Notification {
    _id: string;
    usuarioId: string;
    titulo: string;
    mensaje: string;
    tipo: 'info' | 'warning' | 'success' | 'error';
    leida: boolean;
    link?: string;
    metadata?: any;
    createdAt: string;
}

export const notificacionesService = {
    // Obtener todas las notificaciones del usuario actual
    getAll: async (): Promise<Notification[]> => {
        const response = await api.get<Notification[]>('/notificaciones');
        return response.data;
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
    }
};
