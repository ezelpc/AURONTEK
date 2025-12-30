import api from '@/api/axios';

export interface SystemAdmin {
    _id?: string;
    nombre: string;
    correo: string;
    rol: 'admin-general' | 'admin-subroot';
    activo: boolean;
    permisos?: string[];
    password?: string; // Optional for updates
}

export const adminsService = {
    getAll: async (): Promise<SystemAdmin[]> => {
        const response = await api.get<SystemAdmin[]>('/admins');
        return response.data;
    },

    create: async (data: Partial<SystemAdmin>): Promise<SystemAdmin> => {
        const response = await api.post<SystemAdmin>('/admins', data);
        return response.data;
    },

    update: async (id: string, data: Partial<SystemAdmin>): Promise<SystemAdmin> => {
        const response = await api.put<SystemAdmin>(`/admins/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/admins/${id}`);
    }
};
