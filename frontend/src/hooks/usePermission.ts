import { useAuthStore } from '@/auth/auth.store';

/**
 * Hook to check if user has specific permission(s)
 * @param permission - Single permission string or array of permissions
 * @param requireAll - If true, user must have ALL permissions (AND). If false, user needs ANY permission (OR)
 * @returns boolean indicating if user has required permission(s)
 */
export const usePermission = (
    permission?: string | string[],
    requireAll: boolean = false
): { hasPermission: (perm?: string | string[], reqAll?: boolean) => boolean } => {
    const user = useAuthStore((state) => state.user);
    const storeHasPermission = useAuthStore((state) => state.hasPermission);

    const checkPermission = (perm?: string | string[], reqAll: boolean = false): boolean => {
        if (!user) return false;

        // If no permission specified, return true (no restriction)
        if (!perm) return true;

        // Check for wildcard permission (admin-general has '*')
        if (user.permisos?.includes('*')) return true;

        // Convert permission to array if it's a string
        const requiredPermissions = Array.isArray(perm) ? perm : [perm];

        // Check permissions
        if (reqAll) {
            // ALL permissions required (AND)
            return requiredPermissions.every(p => storeHasPermission(p));
        } else {
            // ANY permission required (OR)
            return requiredPermissions.some(p => storeHasPermission(p));
        }
    };

    // If permission was provided, check it immediately
    if (permission) {
        return {
            hasPermission: () => checkPermission(permission, requireAll)
        };
    }

    // Otherwise return the function for dynamic checking
    return {
        hasPermission: checkPermission
    };
};

/**
 * Hook to get all user permissions
 * @returns Array of permission strings
 */
export const useUserPermissions = (): string[] => {
    const user = useAuthStore((state) => state.user);
    return user?.permisos || [];
};

/**
 * Hook to check if user is admin-general (has wildcard permission)
 * @returns boolean
 */
export const useIsAdminGeneral = (): boolean => {
    const user = useAuthStore((state) => state.user);
    return user?.permisos?.includes('*') || user?.rol === 'admin-general';
};
