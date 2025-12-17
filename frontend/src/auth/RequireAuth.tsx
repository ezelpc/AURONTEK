import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/auth/auth.store';
import { usePermission } from '@/hooks/usePermission';

export const RequireAuth = () => {
    const { isAuthenticated } = useAuthStore();
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect logic based on attempted path
        if (location.pathname.startsWith('/empresa')) {
            return <Navigate to="/acceso-empresa" state={{ from: location }} replace />;
        }
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export const RequirePermission = ({ permission }: { permission: string }) => {
    const { hasPermission } = usePermission(); // Usa el hook que ya tenemos

    if (!hasPermission(permission)) {
        return <div className="p-8 text-center text-red-500">Acceso Denegado: Permisos Insuficientes.</div>;
        // O redirigir a un 403 Page
    }

    return <Outlet />;
};
