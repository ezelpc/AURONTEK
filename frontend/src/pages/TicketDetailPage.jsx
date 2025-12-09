import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Paper,
    Button,
    CircularProgress,
    Alert,
    Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TicketDetail from '../components/tickets/TicketDetail';
import ChatWidget from '../components/chat/ChatWidget';
import ticketService from '../services/ticketService';
import { useAuth } from '../hooks/useAuth';
import { useNotificationContext } from '../contexts/NotificationContext';

/**
 * Página de detalle de ticket con chat integrado
 */
const TicketDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showSuccess, showError } = useNotificationContext();

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [agentes, setAgentes] = useState([]);
    const [becarios, setBecarios] = useState([]);

    // Cargar ticket
    useEffect(() => {
        const loadTicket = async () => {
            try {
                setLoading(true);
                const data = await ticketService.obtenerTicket(id);
                setTicket(data);
            } catch (err) {
                setError(err.response?.data?.message || 'Error al cargar el ticket');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadTicket();
        }
    }, [id]);

    // Cargar agentes y becarios (si es admin)
    useEffect(() => {
        const loadUsers = async () => {
            try {
                // Aquí deberías cargar los usuarios según el rol
                // const response = await api.get('/usuarios', { params: { rol: 'soporte' } });
                // setAgentes(response.data);
            } catch (err) {
                console.error('Error cargando usuarios:', err);
            }
        };

        if (user?.rol === 'admin-interno') {
            loadUsers();
        }
    }, [user]);

    // Actualizar estado
    const handleUpdateStatus = async (ticketId, estado, comentario) => {
        try {
            await ticketService.actualizarEstado(ticketId, estado, comentario);
            showSuccess('Estado actualizado correctamente');

            // Recargar ticket
            const updated = await ticketService.obtenerTicket(ticketId);
            setTicket(updated);
        } catch (err) {
            showError(err.response?.data?.message || 'Error al actualizar estado');
        }
    };

    // Asignar ticket
    const handleAssign = async (ticketId, agenteId) => {
        try {
            await ticketService.asignarTicket(ticketId, agenteId);
            showSuccess('Ticket asignado correctamente');

            // Recargar ticket
            const updated = await ticketService.obtenerTicket(ticketId);
            setTicket(updated);
        } catch (err) {
            showError(err.response?.data?.message || 'Error al asignar ticket');
        }
    };

    // Delegar ticket
    const handleDelegate = async (ticketId, becarioId) => {
        try {
            await ticketService.delegarTicket(ticketId, becarioId);
            showSuccess('Ticket delegado correctamente');

            // Recargar ticket
            const updated = await ticketService.obtenerTicket(ticketId);
            setTicket(updated);
        } catch (err) {
            showError(err.response?.data?.message || 'Error al delegar ticket');
        }
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/tickets')}
                    sx={{ mt: 2 }}
                >
                    Volver a Tickets
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/tickets')}
                sx={{ mb: 2 }}
            >
                Volver a Tickets
            </Button>

            <Grid container spacing={3}>
                {/* Detalle del ticket */}
                <Grid item xs={12} lg={8}>
                    <TicketDetail
                        ticket={ticket}
                        onUpdateStatus={handleUpdateStatus}
                        onAssign={handleAssign}
                        onDelegate={handleDelegate}
                        currentUser={user}
                        agentes={agentes}
                        becarios={becarios}
                    />
                </Grid>

                {/* Chat */}
                <Grid item xs={12} lg={4}>
                    <Paper sx={{ height: '100%', minHeight: 600 }}>
                        <ChatWidget
                            ticketId={id}
                            currentUser={user}
                        />
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default TicketDetailPage;
