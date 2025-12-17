import api from '@/api/axios';
import { User, MetadataPermisos } from '@/types/api.types';

export const userService = {
    // Obtener Metadata (Permisos y Plantillas)
    getMetadataPermisos: async (): Promise<MetadataPermisos> => {
        const response = await api.get<MetadataPermisos>('/usuarios/metadata-permisos');
        return response.data;
    },

    // Estadísticas Dashboard (Usuarios + Empresas)
    getDashboardStats: async () => {
        const response = await api.get('/usuarios/dashboard/stats');
        return response.data;
    },

    // Crear Usuario (Soporta template)
    createUser: async (userData: any): Promise<User> => {
        const response = await api.post<User>('/usuarios', userData);
        return response.data;
    },

    // Actualizar Usuario
    updateUser: async (id: string, userData: Partial<User>): Promise<User> => {
        const response = await api.put<User>(`/usuarios/${id}`, userData);
        return response.data;
    },

    // Eliminar Usuario
    deleteUser: async (id: string): Promise<void> => {
        await api.delete(`/usuarios/${id}`);
    },

    // Listar usuarios
    getUsers: async (empresaId?: string): Promise<User[]> => {
        // Parametro opcional empresaId para filtrar
        const url = empresaId ? `/usuarios?empresaId=${empresaId}` : '/usuarios';
        const response = await api.get<any>(url);
        // Backend might wrap in { usuarios: [] }
        return Array.isArray(response.data) ? response.data : response.data.usuarios || [];
    }
};
