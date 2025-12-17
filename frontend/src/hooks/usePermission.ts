import { useAuthStore } from '@/auth/auth.store';

export const usePermission = () => {
    const hasPermission = useAuthStore((state) => state.hasPermission);
    return { hasPermission };
};

// Hook plural (si tiene ALGUNO de los permisos listados, o TODOS?)
// Por ahora simple.
