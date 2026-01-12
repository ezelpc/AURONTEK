import api from './axios';

export interface Notification {
    _id: string;
    usuarioId: string;
    titulo: string;
    mensaje: string;
    tipo: 'info' | 'success' | 'warning' | 'error';
    leida: boolean;
    metadata?: {
        ticketId?: string;
        [key: string]: any;
    };
    createdAt: Date;
}

export const notificationsService = {
    // Obtener notificaciones del usuario
    getAll: async (leida?: boolean, limite = 20): Promise<Notification[]> => {
        const params: any = { limite };
        if (leida !== undefined) params.leida = leida;

        const response = await api.get<Notification[]>('/notificaciones', { params });
        return response.data;
    },

    // Contar notificaciones no leídas
    getUnreadCount: async (): Promise<number> => {
        const response = await api.get<{ count: number }>('/notificaciones/no-leidas/count');
        return response.data.count;
    },

    // Marcar una notificación como leída
    markAsRead: async (id: string): Promise<Notification> => {
        const response = await api.patch<Notification>(`/notificaciones/${id}/leer`);
        return response.data;
    },

    // Marcar todas como leídas
    markAllAsRead: async (): Promise<void> => {
        await api.patch('/notificaciones/leer-todas');
    },

    // Eliminar una notificación
    delete: async (id: string): Promise<void> => {
        await api.delete(`/notificaciones/${id}`);
    },

    // Eliminar todas las notificaciones
    deleteAll: async (): Promise<void> => {
        await api.delete('/notificaciones');
    }
};
