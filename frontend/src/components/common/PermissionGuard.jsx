import React from 'react';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

/**
 * PermissionGuard
 * 
 * Renders children only if the user has the required permission.
 * Handles loading state gracefully.
 * 
 * @param {Object} props
 * @param {string} props.permission - Permission key to check (e.g. 'users.create')
 * @param {React.ReactNode} props.children - Content to render if permitted
 * @param {React.ReactNode} props.fallback - Optional content to render if denied (default null)
 * @param {boolean} props.showLoading - Whether to show a spinner while loading (default false)
 */
const PermissionGuard = ({ permission, children, fallback = null, showLoading = false }) => {
    const { hasPermission, loading } = useAuth();

    if (loading) {
        if (showLoading) {
            return (
                <Box display="flex" justifyContent="center" p={2}>
                    <CircularProgress size={24} />
                </Box>
            );
        }
        return null; // Don't show anything while determining status
    }

    if (hasPermission(permission)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};

export default PermissionGuard;
