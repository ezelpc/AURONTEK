import React from 'react';
import { Container, Paper } from '@mui/material';
import NotificationCenter from '../components/notifications/NotificationCenter';

/**
 * Página completa de notificaciones
 */
const NotificacionesPage = () => {
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ height: 'calc(100vh - 150px)', minHeight: 600 }}>
                <NotificationCenter />
            </Paper>
        </Container>
    );
};

export default NotificacionesPage;
