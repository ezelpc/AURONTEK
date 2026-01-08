import { useEffect } from 'react';
import { useAuthStore } from '@/auth/auth.store';

/**
 * Hook para refrescar automáticamente los permisos del usuario
 * @param intervalMinutes - Intervalo en minutos para refrescar (default: 5)
 * 
 * TEMPORALMENTE DESACTIVADO - Causaba logout automático
 */
export const usePermissionRefresh = (intervalMinutes: number = 5) => {
    const { isAuthenticated, refreshPermissions } = useAuthStore();

    useEffect(() => {
        // DESACTIVADO TEMPORALMENTE
        // El refresh automático está causando logout
        // TODO: Investigar por qué /api/auth/refresh-permissions falla

        /*
        if (!isAuthenticated) return;

        // Esperar 5 segundos antes del primer refresh para no interferir con el login
        const initialTimeout = setTimeout(() => {
            console.log('🔄 Initial permission refresh...');
            refreshPermissions();
        }, 5000);

        // Configurar intervalo para refreshes periódicos
        const intervalMs = intervalMinutes * 60 * 1000;
        const interval = setInterval(() => {
            console.log('🔄 Auto-refreshing permissions...');
            refreshPermissions();
        }, intervalMs);

        // Cleanup al desmontar
        return () => {
            clearTimeout(initialTimeout);
            clearInterval(interval);
        };
        */
    }, [isAuthenticated, refreshPermissions, intervalMinutes]);
};
