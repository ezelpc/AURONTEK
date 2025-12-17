import api from '@/api/axios';
import { Empresa } from '@/types/api.types';

export const companiesService = {
    // Listar todas las empresas
    getCompanies: async (): Promise<Empresa[]> => {
        const response = await api.get<Empresa[]>('/empresas');
        return response.data;
    },

    // Crear empresa
    createCompany: async (companyData: Partial<Empresa>): Promise<Empresa> => {
        const response = await api.post<Empresa>('/empresas', companyData);
        return response.data;
    },

    // Actualizar empresa
    updateCompany: async (id: string, companyData: Partial<Empresa>): Promise<Empresa> => {
        const response = await api.put<Empresa>(`/empresas/${id}`, companyData);
        return response.data;
    },

    // Suspender / Activar Licencia
    toggleLicense: async (id: string, estado: boolean): Promise<Empresa> => {
        // Enviar el nuevo estado deseado (activo)
        const response = await api.patch<Empresa>(`/empresas/${id}/licencia`, { activo: estado });
        return response.data;
    },

    // Regenerar Código de Acceso
    regenerateCode: async (id: string): Promise<{ codigo_acceso: string }> => {
        const response = await api.post<{ codigo_acceso: string }>(`/empresas/${id}/regenerar-codigo`);
        return response.data;
    },

    // Eliminar empresa
    deleteCompany: async (id: string): Promise<void> => {
        await api.delete(`/empresas/${id}`);
    }
};
