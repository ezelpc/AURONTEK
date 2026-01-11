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
    },

    downloadTemplate: async (): Promise<void> => {
        const response = await api.get('/habilidades/template', {
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'plantilla_grupos_atencion.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    bulkUpload: async (file: File): Promise<any> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/habilidades/bulk', formData, {
            headers: {
                'Content-Type': undefined
            }
        });
        return response.data;
    }
};
