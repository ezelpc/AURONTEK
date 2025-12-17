import React from 'react';
import { usePermission } from '@/hooks/usePermission';

interface ProtectedElementProps {
    permission: string;
    children: React.ReactNode;
    fallback?: React.ReactNode; // Lo que se muestra si no tiene permiso (opcional, ej. lock icon)
}

export const ProtectedElement: React.FC<ProtectedElementProps> = ({
    permission,
    children,
    fallback = null
}) => {
    const { hasPermission } = usePermission();
    const hasAccess = hasPermission(permission);

    if (!hasAccess) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
