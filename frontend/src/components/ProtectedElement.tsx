import React from 'react';
import { useAuthStore } from '@/auth/auth.store';

interface ProtectedElementProps {
    permission: string | string[];
    requireAll?: boolean; // true = AND, false = OR (default)
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

export const ProtectedElement: React.FC<ProtectedElementProps> = ({
    permission,
    requireAll = false,
    fallback = null,
    children
}) => {
    const { user } = useAuthStore();

    if (!user) return <>{fallback}</>;

    // Get user permissions
    const userPermissions = user.permisos || [];

    // Check for wildcard permission (admin-general has '*')
    if (userPermissions.includes('*')) {
        return <>{children}</>;
    }

    // Convert permission to array if it's a string
    const requiredPermissions = Array.isArray(permission) ? permission : [permission];

    // Check permissions
    const hasPermission = requireAll
        ? requiredPermissions.every(perm => userPermissions.includes(perm))
        : requiredPermissions.some(perm => userPermissions.includes(perm));

    return hasPermission ? <>{children}</> : <>{fallback}</>;
};
