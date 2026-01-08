import api from '@/api/axios';
import { LoginResponse } from '@/types/api.types';

export const authService = {
    // Login para Staff Aurontek (Admin System)
    loginAdmin: async (correo: string, contrasenia: string, captchaToken?: string): Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>('/auth/login', {
            correo,
            contraseña: contrasenia,
            // codigoAcceso: 'Auro2024', // REMOVED: Admins don't have company code
            captchaToken
        });
        return response.data;
    },

    // Paso 1: Validar Acceso Empresa (Gatekeeper)
    validarCodigoEmpresa: async (codigo: string): Promise<{ msg: string, empresa: { id: string, nombre: string } }> => {
        const response = await api.post('/auth/validate-code', {
            codigo
        });
        return response.data;
    },

    // Paso 2: Login Usuario Empresa
    loginEmpresa: async (correo: string, contrasenia: string, codigoAcceso: string, captchaToken: string): Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>('/auth/login', {
            correo,
            contraseña: contrasenia,
            codigoAcceso,
            captchaToken
        });
        return response.data;
    },

    // Actualizar estado de actividad del usuario
    updateStatus: async (estado: 'available' | 'busy' | 'offline'): Promise<void> => {
        console.log('🔄 [auth.service] Actualizando estado a:', estado);
        try {
            const response = await api.put('/auth/status', { estado });
            console.log('✅ [auth.service] Estado actualizado exitosamente:', response.data);
        } catch (error: any) {
            console.error('❌ [auth.service] Error al actualizar estado:', error.response?.data || error.message);
            throw error;
        }
    },

    // Refrescar permisos del usuario actual
    refreshPermissions: async (): Promise<{ permisos: string[], rol: string, updatedAt: Date }> => {
        const response = await api.get('/auth/refresh-permissions');
        return response.data;
    }
};
