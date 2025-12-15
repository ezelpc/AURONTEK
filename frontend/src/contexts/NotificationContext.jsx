import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, Badge, IconButton, Menu, MenuItem, Typography, Box, Divider } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNotifications } from '../hooks/useNotifications';

const NotificationContext = createContext(null);

/**
 * Provider para notificaciones
 * Proporciona sistema de notificaciones toast y centro de notificaciones
 */
export const NotificationProvider = ({ children }) => {
    const notificationsData = useNotifications(true, 30000); // Auto-refresh cada 30s
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info', // success, error, warning, info
        duration: 6000,
    });

    // Mostrar notificación toast
    const showNotification = useCallback((message, severity = 'info', duration = 6000) => {
        setSnackbar({
            open: true,
            message,
            severity,
            duration,
        });
    }, []);

    // Cerrar snackbar
    const handleCloseSnackbar = useCallback((event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar(prev => ({ ...prev, open: false }));
    }, []);

    // Shortcuts para tipos comunes
    const showSuccess = useCallback((message) => showNotification(message, 'success'), [showNotification]);
    const showError = useCallback((message) => showNotification(message, 'error'), [showNotification]);
    const showWarning = useCallback((message) => showNotification(message, 'warning'), [showNotification]);
    const showInfo = useCallback((message) => showNotification(message, 'info'), [showNotification]);

    // 🛡️ LISTENER GLOBAL PARA 403 FORBIDDEN
    // Escucha eventos disparados por api.js
    React.useEffect(() => {
        const handleForbidden = (event) => {
            const msg = event.detail?.message || 'Acceso Denegado: No tienes permisos.';
            showError(msg);
        };
        window.addEventListener('auth:forbidden', handleForbidden);
        return () => window.removeEventListener('auth:forbidden', handleForbidden);
    }, [showError]);

    const value = {
        ...notificationsData,
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}

            {/* Snackbar global para notificaciones toast */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={snackbar.duration}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </NotificationContext.Provider>
    );
};

/**
 * Hook para usar el contexto de notificaciones
 */
export const useNotificationContext = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotificationContext debe usarse dentro de NotificationProvider');
    }
    return context;
};

/**
 * Componente de icono de notificaciones con badge
 * Para usar en el header/navbar
 */
export const NotificationBell = () => {
    const { unreadCount, notifications, markAsRead } = useNotificationContext();
    const [anchorEl, setAnchorEl] = useState(null);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.leida) {
            await markAsRead(notification._id);
        }
        handleClose();
        // Aquí puedes agregar navegación al detalle
    };

    return (
        <>
            <IconButton color="inherit" onClick={handleClick}>
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                    sx: { width: 360, maxHeight: 480 }
                }}
            >
                <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="h6">Notificaciones</Typography>
                </Box>
                <Divider />

                {notifications.length === 0 ? (
                    <MenuItem disabled>
                        <Typography variant="body2" color="text.secondary">
                            No hay notificaciones
                        </Typography>
                    </MenuItem>
                ) : (
                    notifications.slice(0, 10).map((notification) => (
                        <MenuItem
                            key={notification._id}
                            onClick={() => handleNotificationClick(notification)}
                            sx={{
                                backgroundColor: notification.leida ? 'transparent' : 'action.hover',
                                whiteSpace: 'normal',
                                py: 1.5,
                            }}
                        >
                            <Box>
                                <Typography variant="body2" fontWeight={notification.leida ? 'normal' : 'bold'}>
                                    {notification.titulo}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {notification.mensaje}
                                </Typography>
                            </Box>
                        </MenuItem>
                    ))
                )}

                {notifications.length > 10 && (
                    <>
                        <Divider />
                        <MenuItem onClick={handleClose}>
                            <Typography variant="body2" color="primary" textAlign="center" width="100%">
                                Ver todas las notificaciones
                            </Typography>
                        </MenuItem>
                    </>
                )}
            </Menu>
        </>
    );
};

export default NotificationContext;
