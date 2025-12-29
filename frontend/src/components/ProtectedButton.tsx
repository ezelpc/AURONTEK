import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useAuthStore } from '@/auth/auth.store';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProtectedButtonProps extends ButtonProps {
    permission: string | string[];
    requireAll?: boolean; // true = AND, false = OR (default)
    showTooltip?: boolean;
    tooltipMessage?: string;
}

export const ProtectedButton: React.FC<ProtectedButtonProps> = ({
    permission,
    requireAll = false,
    showTooltip = true,
    tooltipMessage = 'No tienes permisos para esta acción',
    children,
    ...buttonProps
}) => {
    const { user } = useAuthStore();

    if (!user) return null;

    // Get user permissions
    const userPermissions = user.permisos || [];

    // Check for wildcard permission (admin-general has '*')
    if (userPermissions.includes('*')) {
        return <Button {...buttonProps}>{children}</Button>;
    }

    // Convert permission to array if it's a string
    const requiredPermissions = Array.isArray(permission) ? permission : [permission];

    // Check permissions
    const hasPermission = requireAll
        ? requiredPermissions.every(perm => userPermissions.includes(perm))
        : requiredPermissions.some(perm => userPermissions.includes(perm));

    if (!hasPermission) {
        if (!showTooltip) return null;

        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="inline-block">
                            <Button {...buttonProps} disabled className="cursor-not-allowed">
                                {children}
                            </Button>
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{tooltipMessage}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return <Button {...buttonProps}>{children}</Button>;
};
