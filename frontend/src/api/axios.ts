import axios from 'axios';
import { useAuthStore } from '@/auth/auth.store';

// 1. Crear Instancia
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api', // Gateway URL
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. Interceptor Request: Inyectar Token
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 3. Interceptor Response: Manejo de Errores Globales (401/403)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Caso 401: Unauthorized (Token expirado o inválido)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Evitar bucle infinito

            // SOLO hacer logout si es un error de autenticación explícito
            // No hacer logout automático en requests normales que fallen con 401
            const isAuthRoute = originalRequest.url?.includes('/auth/');

            if (isAuthRoute) {
                console.warn('❌ Error de autenticación, cerrando sesión');
                useAuthStore.getState().logout();
                window.location.href = '/access';
            } else {
                console.warn('⚠️ Request no autorizado (401):', originalRequest.url);
                // No hacer logout automático, dejar que el componente maneje el error
            }

            // AQUI IRÍA LA LÓGICA DE SILENT REFRESH
            // Por simplicidad inicial: Logout directo solo en rutas de auth.
            // Para implementar Silent Refresh se necesita endpoint /auth/refresh-token

            /* 
            try {
                const { data } = await axios.post('/auth/refresh-token');
                useAuthStore.getState().setToken(data.token);
                originalRequest.headers.Authorization = `Bearer ${data.token}`;
                return api(originalRequest);
            } catch (refreshError) {
                useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            }
            */
        }

        // Caso 403: Forbidden (Falta Permiso)
        if (error.response?.status === 403) {
            console.warn('Acceso denegado (403):', error.response.data.msg);
            // Mostrar Toast: "No tienes permiso para esto"
        }

        return Promise.reject(error);
    }
);

export default api;
