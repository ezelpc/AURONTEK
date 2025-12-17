import api from '@/api/axios';

export interface Service {
    _id?: string;
    nombre: string;
    descripcion: string;
    alcance: 'global' | 'local';
    empresa?: string; // ID if local
    tipo: string;
    area: string;
    prioridad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
    sla: string;
    gruposDeAtencion: string;
    precio: number;
    activo: boolean;
}

export const servicesService = {
    // List all services (backend filters by permission/scope)
    getServices: async (): Promise<Service[]> => {
        const response = await api.get<Service[]>('/services');
        return response.data;
    },

    createService: async (data: Partial<Service>): Promise<Service> => {
        const response = await api.post<Service>('/services', data);
        return response.data;
    },

    updateService: async (id: string, data: Partial<Service>): Promise<Service> => {
        const response = await api.put<Service>(`/services/${id}`, data);
        return response.data;
    },

    deleteService: async (id: string): Promise<void> => {
        await api.delete(`/services/${id}`);
    },

    bulkUpload: async (file: File): Promise<any> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/services/bulk-upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    downloadTemplate: async (): Promise<void> => {
        const response = await api.get('/services/template', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'template_servicios.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};
