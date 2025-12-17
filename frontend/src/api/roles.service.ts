import api from './axios';

export interface Role {
    _id: string;
    nombre: string;
    slug: string;
    descripcion: string;
    empresa?: {
        _id: string;
        nombre: string;
    } | string;
    permisos: string[];
    nivel: number;
    activo: boolean;
}

export interface PermissionGroup {
    group: string;
    permissions: {
        key: string;
        label: string;
        description: string;
    }[];
}

export const rolesService = {
    getRoles: async (empresaId?: string) => {
        const params = empresaId ? { empresaId } : {};
        const { data } = await api.get<Role[]>('/roles', { params });
        return data;
    },

    getPermissions: async () => {
        const { data } = await api.get<PermissionGroup[]>('/roles/permissions');
        return data;
    },

    createRole: async (roleData: Partial<Role> & { empresaId?: string }) => {
        const { data } = await api.post<Role>('/roles', roleData);
        return data;
    },

    updateRole: async (id: string, roleData: Partial<Role>) => {
        const { data } = await api.put<Role>(`/roles/${id}`, roleData);
        return data;
    },

    deleteRole: async (id: string) => {
        await api.delete(`/roles/${id}`);
    }
};
