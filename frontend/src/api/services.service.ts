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
    categoria?: string; // Populated or string
}

export const servicesService = {
    // List services, optionally filtering by scope
    getServices: async (alcance?: 'global' | 'local'): Promise<Service[]> => {
        const params = alcance ? { alcance } : {};
        const response = await api.get<Service[]>('/services', { params });
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
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const text = e.target?.result as string;
                    if (!text) throw new Error("Archivo vacío");

                    // Simple CSV Parse
                    const lines = text.split('\n').filter(l => l.trim());
                    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

                    const services = lines.slice(1).map(line => {
                        // Handle comma separation respecting quotes (simple regex fallback or split)
                        // Using simple split for now assuming template format
                        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
                        const obj: any = {};
                        headers.forEach((h, i) => {
                            if (h && values[i] !== undefined) obj[h] = values[i];
                        });
                        return obj;
                    });

                    const response = await api.post('/services/bulk-upload', services);
                    resolve(response.data);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    },

    downloadTemplate: async (scope: 'global' | 'local'): Promise<void> => {
        const response = await api.get('/services/template', {
            params: { alcance: scope },
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'plantilla_servicios.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};
