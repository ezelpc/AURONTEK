import api from '@/api/axios';

export interface CareGroup {
    _id?: string;
    nombre: string;
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
        console.log('[BULK UPLOAD] Starting upload');
        console.log('[BULK UPLOAD] File:', file.name, file.size, file.type);

        const formData = new FormData();
        formData.append('file', file);

        console.log('[BULK UPLOAD] FormData created');
        console.log('[BULK UPLOAD] FormData entries:', Array.from(formData.entries()));

        // IMPORTANT: Don't set Content-Type manually - axios will add boundary automatically
        const response = await api.post('/habilidades/bulk', formData);

        console.log('[BULK UPLOAD] Response:', response);
        return response.data;
    }
};
