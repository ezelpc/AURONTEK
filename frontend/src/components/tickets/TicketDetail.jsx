import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Chip,
    Button,
    TextField,
    MenuItem,
    Divider,
    Card,
    CardContent,
    Avatar,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
    TimelineOppositeContent,
} from '@mui/lab';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CategoryIcon from '@mui/icons-material/Category';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import FloatingChat from '../chat/FloatingChat';

/**
 * Vista detallada de un ticket
 * @param {Object} props
 * @param {Object} props.ticket - Datos del ticket
 * @param {Function} props.onUpdateStatus - Callback para actualizar estado
 * @param {Function} props.onAssign - Callback para asignar
 * @param {Function} props.onDelegate - Callback para delegar
 * @param {Object} props.currentUser - Usuario actual
 * @param {Array} props.agentes - Lista de agentes disponibles
 * @param {Array} props.becarios - Lista de becarios disponibles
 */
const TicketDetail = ({
    ticket,
    onUpdateStatus,
    onAssign,
    onDelegate,
    currentUser,
    agentes = [],
    becarios = [],
}) => {
    const [editingStatus, setEditingStatus] = useState(false);
    const [newStatus, setNewStatus] = useState(ticket?.estado || '');
    const [statusComment, setStatusComment] = useState('');
    const [assigningAgent, setAssigningAgent] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState('');

    if (!ticket) {
        return (
            <Paper sx={{ p: 3 }}>
                <Typography>No se encontró el ticket</Typography>
            </Paper>
        );
    }

    // Manejar actualización de estado
    const handleSaveStatus = async () => {
        if (onUpdateStatus) {
            await onUpdateStatus(ticket._id, newStatus, statusComment);
            setEditingStatus(false);
            setStatusComment('');
        }
    };

    // Manejar asignación
    const handleAssign = async () => {
        if (onAssign && selectedAgent) {
            await onAssign(ticket._id, selectedAgent);
            setAssigningAgent(false);
            setSelectedAgent('');
        }
    };

    // Obtener color de prioridad
    const getPriorityColor = (prioridad) => {
        switch (prioridad?.toLowerCase()) {
            case 'critica': return 'error';
            case 'alta': return 'error';
            case 'media': return 'warning';
            case 'baja': return 'success';
            default: return 'default';
        }
    };

    // Obtener color de estado
    const getStatusColor = (estado) => {
        switch (estado) {
            case 'resuelto': return 'success';
            case 'en_progreso': return 'warning';
            case 'cerrado': return 'default';
            case 'pendiente': return 'error';
            default: return 'info';
        }
    };

    return (
        <Box>
            <Grid container spacing={3}>
                {/* Información Principal */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3 }}>
                        {/* Header */}
                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={3}>
                            <Box>
                                <Typography variant="h5" fontWeight="bold" gutterBottom>
                                    {ticket.titulo}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Folio: {ticket.folio || `#${ticket._id?.slice(-6)}`}
                                </Typography>
                            </Box>

                            <Box display="flex" gap={1}>
                                <Chip
                                    label={ticket.estado?.replace('_', ' ').toUpperCase()}
                                    color={getStatusColor(ticket.estado)}
                                />
                                <Chip
                                    label={ticket.prioridad?.toUpperCase()}
                                    color={getPriorityColor(ticket.prioridad)}
                                    icon={<PriorityHighIcon />}
                                />
                            </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        {/* Descripción */}
                        <Box mb={3}>
                            <Typography variant="h6" gutterBottom>
                                Descripción
                            </Typography>
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                {ticket.descripcion}
                            </Typography>
                        </Box>

                        {/* Clasificación IA */}
                        {ticket.clasificacionIA && (
                            <>
                                <Divider sx={{ my: 2 }} />
                                <Box mb={3}>
                                    <Typography variant="h6" gutterBottom>
                                        Clasificación IA
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6} sm={3}>
                                            <Typography variant="caption" color="text.secondary">
                                                Tipo
                                            </Typography>
                                            <Typography variant="body2">
                                                {ticket.clasificacionIA.tipo}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <Typography variant="caption" color="text.secondary">
                                                Categoría
                                            </Typography>
                                            <Typography variant="body2">
                                                {ticket.clasificacionIA.categoria}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <Typography variant="caption" color="text.secondary">
                                                Grupo
                                            </Typography>
                                            <Typography variant="body2">
                                                {ticket.clasificacionIA.grupo_atencion}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <Typography variant="caption" color="text.secondary">
                                                SLA
                                            </Typography>
                                            <Typography variant="body2">
                                                {ticket.clasificacionIA.tiempoResolucion} min
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </>
                        )}
                    </Paper>

                    {/* Timeline de cambios */}
                    {ticket.historial && ticket.historial.length > 0 && (
                        <Paper sx={{ p: 3, mt: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Historial de Cambios
                            </Typography>
                            <Timeline>
                                {ticket.historial.map((cambio, index) => (
                                    <TimelineItem key={index}>
                                        <TimelineOppositeContent color="text.secondary">
                                            {new Date(cambio.fecha).toLocaleString('es-MX')}
                                        </TimelineOppositeContent>
                                        <TimelineSeparator>
                                            <TimelineDot color="primary" />
                                            {index < ticket.historial.length - 1 && <TimelineConnector />}
                                        </TimelineSeparator>
                                        <TimelineContent>
                                            <Typography variant="body2" fontWeight="bold">
                                                {cambio.accion}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Por: {cambio.usuario?.nombre || 'Sistema'}
                                            </Typography>
                                            {cambio.comentario && (
                                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                    {cambio.comentario}
                                                </Typography>
                                            )}
                                        </TimelineContent>
                                    </TimelineItem>
                                ))}
                            </Timeline>
                        </Paper>
                    )}
                </Grid>

                {/* Sidebar */}
                <Grid item xs={12} md={4}>
                    {/* Información del Ticket */}
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Información
                            </Typography>

                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                <CalendarTodayIcon fontSize="small" color="action" />
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Creado
                                    </Typography>
                                    <Typography variant="body2">
                                        {new Date(ticket.createdAt).toLocaleDateString('es-MX')}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                <PersonIcon fontSize="small" color="action" />
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Creado por
                                    </Typography>
                                    <Typography variant="body2">
                                        {ticket.creadoPor?.nombre || 'Usuario'}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                <CategoryIcon fontSize="small" color="action" />
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Categoría
                                    </Typography>
                                    <Typography variant="body2">
                                        {ticket.categoria || 'General'}
                                    </Typography>
                                </Box>
                            </Box>

                            {ticket.servicioNombre && (
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Servicio
                                        </Typography>
                                        <Typography variant="body2">
                                            {ticket.servicioNombre}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    {/* Cambiar Estado */}
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6">
                                    Estado
                                </Typography>
                                {!editingStatus && (
                                    <IconButton size="small" onClick={() => setEditingStatus(true)}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </Box>

                            {editingStatus ? (
                                <Box>
                                    <TextField
                                        select
                                        fullWidth
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                        size="small"
                                        sx={{ mb: 2 }}
                                    >
                                        <MenuItem value="abierto">Abierto</MenuItem>
                                        <MenuItem value="en_progreso">En Progreso</MenuItem>
                                        <MenuItem value="pendiente">Pendiente</MenuItem>
                                        <MenuItem value="resuelto">Resuelto</MenuItem>
                                        <MenuItem value="cerrado">Cerrado</MenuItem>
                                    </TextField>

                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={2}
                                        placeholder="Comentario (opcional)"
                                        value={statusComment}
                                        onChange={(e) => setStatusComment(e.target.value)}
                                        size="small"
                                        sx={{ mb: 2 }}
                                    />

                                    <Box display="flex" gap={1}>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            startIcon={<SaveIcon />}
                                            onClick={handleSaveStatus}
                                            fullWidth
                                        >
                                            Guardar
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<CancelIcon />}
                                            onClick={() => {
                                                setEditingStatus(false);
                                                setNewStatus(ticket.estado);
                                                setStatusComment('');
                                            }}
                                            fullWidth
                                        >
                                            Cancelar
                                        </Button>
                                    </Box>
                                </Box>
                            ) : (
                                <Chip
                                    label={ticket.estado?.replace('_', ' ').toUpperCase()}
                                    color={getStatusColor(ticket.estado)}
                                    sx={{ width: '100%' }}
                                />
                            )}
                        </CardContent>
                    </Card>

                    {/* Asignación */}
                    {currentUser?.rol === 'admin-interno' && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Asignación
                                </Typography>

                                {ticket.agenteAsignado ? (
                                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                                        <Avatar sx={{ width: 32, height: 32 }}>
                                            {ticket.agenteAsignado.nombre[0]}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2">
                                                {ticket.agenteAsignado.nombre}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {ticket.agenteAsignado.rol}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="text.secondary" mb={2}>
                                        Sin asignar
                                    </Typography>
                                )}

                                {assigningAgent ? (
                                    <Box>
                                        <TextField
                                            select
                                            fullWidth
                                            value={selectedAgent}
                                            onChange={(e) => setSelectedAgent(e.target.value)}
                                            size="small"
                                            sx={{ mb: 2 }}
                                        >
                                            {agentes.map((agente) => (
                                                <MenuItem key={agente._id} value={agente._id}>
                                                    {agente.nombre} - {agente.rol}
                                                </MenuItem>
                                            ))}
                                        </TextField>

                                        <Box display="flex" gap={1}>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={handleAssign}
                                                fullWidth
                                            >
                                                Asignar
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => {
                                                    setAssigningAgent(false);
                                                    setSelectedAgent('');
                                                }}
                                                fullWidth
                                            >
                                                Cancelar
                                            </Button>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        startIcon={<AssignmentIndIcon />}
                                        onClick={() => setAssigningAgent(true)}
                                    >
                                        {ticket.agenteAsignado ? 'Reasignar' : 'Asignar Agente'}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </Grid>
            </Grid>

            {/* Chat Flotante: Asistente Unificado */}
            <FloatingChat ticketId={ticket._id} />
        </Box>
    );
};

export default TicketDetail;
