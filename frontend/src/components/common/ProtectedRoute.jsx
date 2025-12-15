import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress, Container } from '@mui/material'; // Standard MUI components?
import { useAuth } from '../../hooks/useAuth';

/**
 * ProtectedRoute
 * 
 * Protects a route or set of routes.
 * 
 * @param {Object} props
 * @param {string} props.requiredPermission - Permission key required to access route
 * @param {string} props.redirectTo - Path to redirect if denied (default: '/acceso-denegado' or '/')
 */
const ProtectedRoute = ({ requiredPermission, redirectTo = '/' }) => {
    const { hasPermission, loading, isAuthenticated } = useAuth();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/acceso-empresa" replace />;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
        console.warn(`⛔ Acceso Denegado: Falta permiso '${requiredPermission}'`);
        // We could redirect to a dedicated 403 page
        return <Navigate to={redirectTo} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
