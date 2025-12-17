import api from '@/api/axios';

export interface CareGroup {
    _id?: string;
    nombre: string;
    categoria: string;
    descripcion?: string;
    activo: boolean;
}

export const careGroupsService = {
    getAll: async (): Promise<CareGroup[]> => {
        const response = await api.get<CareGroup[]>('/habilidades');
        return response.data;
    },

    create: async (data: Partial<CareGroup>): Promise<CareGroup> => {
        const response = await api.post<CareGroup>('/habilidades', data);
        return response.data;
    },

    update: async (id: string, data: Partial<CareGroup>): Promise<CareGroup> => {
        const response = await api.put<CareGroup>(`/habilidades/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/habilidades/${id}`);
    }
};
