import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    Button,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Badge,
    Tabs,
    Tab,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

/**
 * Centro de notificaciones completo
 */
const NotificationCenter = () => {
    const navigate = useNavigate();
    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        removeNotification,
    } = useNotificationContext();

    const [filter, setFilter] = useState('all'); // all, unread, read
    const [typeFilter, setTypeFilter] = useState('all'); // all, info, success, warning, error

    // Filtrar notificaciones
    const filteredNotifications = notifications.filter(notif => {
        const matchesReadFilter =
            filter === 'all' ||
            (filter === 'unread' && !notif.leida) ||
            (filter === 'read' && notif.leida);

        const matchesTypeFilter =
            typeFilter === 'all' || notif.tipo === typeFilter;

        return matchesReadFilter && matchesTypeFilter;
    });

    // Manejar click en notificación
    const handleNotificationClick = async (notification) => {
        if (!notification.leida) {
            await markAsRead(notification._id);
        }

        // Navegar si tiene enlace
        if (notification.enlace) {
            navigate(notification.enlace);
        }
    };

    // Obtener color según tipo
    const getTypeColor = (tipo) => {
        switch (tipo) {
            case 'success': return 'success';
            case 'error': return 'error';
            case 'warning': return 'warning';
            default: return 'info';
        }
    };

    // Obtener icono según tipo
    const getTypeIcon = (tipo) => {
        switch (tipo) {
            case 'success': return '✓';
            case 'error': return '✕';
            case 'warning': return '⚠';
            default: return 'ℹ';
        }
    };

    // Formatear fecha
    const formatDate = (date) => {
        const now = new Date();
        const notifDate = new Date(date);
        const diffMs = now - notifDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours} h`;
        if (diffDays < 7) return `Hace ${diffDays} días`;

        return notifDate.toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short',
        });
    };

    return (
        <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5" fontWeight="bold">
                        Notificaciones
                        {unreadCount > 0 && (
                            <Chip
                                label={unreadCount}
                                color="error"
                                size="small"
                                sx={{ ml: 2 }}
                            />
                        )}
                    </Typography>

                    {unreadCount > 0 && (
                        <Button
                            startIcon={<MarkEmailReadIcon />}
                            onClick={markAllAsRead}
                            size="small"
                        >
                            Marcar todas como leídas
                        </Button>
                    )}
                </Box>

                {/* Filtros */}
                <Box sx={{ mt: 2 }}>
                    <Tabs
                        value={filter}
                        onChange={(e, newValue) => setFilter(newValue)}
                        variant="fullWidth"
                    >
                        <Tab label="Todas" value="all" />
                        <Tab label={`No leídas (${unreadCount})`} value="unread" />
                        <Tab label="Leídas" value="read" />
                    </Tabs>
                </Box>

                {/* Filtro por tipo */}
                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                        label="Todas"
                        onClick={() => setTypeFilter('all')}
                        color={typeFilter === 'all' ? 'primary' : 'default'}
                        size="small"
                    />
                    <Chip
                        label="Info"
                        onClick={() => setTypeFilter('info')}
                        color={typeFilter === 'info' ? 'info' : 'default'}
                        size="small"
                    />
                    <Chip
                        label="Éxito"
                        onClick={() => setTypeFilter('success')}
                        color={typeFilter === 'success' ? 'success' : 'default'}
                        size="small"
                    />
                    <Chip
                        label="Advertencia"
                        onClick={() => setTypeFilter('warning')}
                        color={typeFilter === 'warning' ? 'warning' : 'default'}
                        size="small"
                    />
                    <Chip
                        label="Error"
                        onClick={() => setTypeFilter('error')}
                        color={typeFilter === 'error' ? 'error' : 'default'}
                        size="small"
                    />
                </Box>
            </Box>

            {/* Lista de notificaciones */}
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
                {loading ? (
                    <Box display="flex" justifyContent="center" p={4}>
                        <Typography color="text.secondary">Cargando...</Typography>
                    </Box>
                ) : filteredNotifications.length === 0 ? (
                    <Box display="flex" flexDirection="column" alignItems="center" p={4}>
                        <NotificationsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography color="text.secondary">
                            No hay notificaciones {filter !== 'all' && filter}
                        </Typography>
                    </Box>
                ) : (
                    <List>
                        {filteredNotifications.map((notification, index) => (
                            <React.Fragment key={notification._id || index}>
                                <ListItem
                                    alignItems="flex-start"
                                    sx={{
                                        bgcolor: notification.leida ? 'transparent' : 'action.hover',
                                        cursor: 'pointer',
                                        '&:hover': { bgcolor: 'action.selected' },
                                    }}
                                    onClick={() => handleNotificationClick(notification)}
                                    secondaryAction={
                                        <IconButton
                                            edge="end"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeNotification(notification._id);
                                            }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    }
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: `${getTypeColor(notification.tipo)}.main` }}>
                                            {getTypeIcon(notification.tipo)}
                                        </Avatar>
                                    </ListItemAvatar>

                                    <ListItemText
                                        primary={
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Typography
                                                    variant="body1"
                                                    fontWeight={notification.leida ? 'normal' : 'bold'}
                                                >
                                                    {notification.titulo}
                                                </Typography>
                                                {!notification.leida && (
                                                    <Badge color="primary" variant="dot" />
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            <>
                                                <Typography variant="body2" color="text.secondary">
                                                    {notification.mensaje}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatDate(notification.createdAt || notification.fecha)}
                                                </Typography>
                                            </>
                                        }
                                    />
                                </ListItem>
                                {index < filteredNotifications.length - 1 && <Divider variant="inset" component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Box>
        </Paper>
    );
};

export default NotificationCenter;
