import React, { useState } from 'react';
import {
    Paper,
    Chip, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, Grid, TextField, MenuItem
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import {
    Visibility as VisibilityIcon,
    AssignmentInd as AssignIcon
} from '@mui/icons-material';
import { asignarAgente, cambiarEstado, cambiarPrioridad } from '../../services/ticketAdminService';

const TicketsTable = ({ tickets, onUpdate }) => {
    const [openDetalle, setOpenDetalle] = useState(false);
    const [openAsignar, setOpenAsignar] = useState(false);
    const [openEstado, setOpenEstado] = useState(false);
    const [openPrioridad, setOpenPrioridad] = useState(false);
    const [ticketActual, setTicketActual] = useState(null);
    const [agenteId, setAgenteId] = useState('');
    const [nuevoEstado, setNuevoEstado] = useState('');
    const [nuevaPrioridad, setNuevaPrioridad] = useState('');

    const estados = ['abierto', 'en_proceso', 'en_espera', 'resuelto', 'cerrado'];
    const prioridades = ['baja', 'media', 'alta', 'crítica'];

    const getEstadoColor = (estado) => {
        const colores = {
            'abierto': 'error',
            'en_proceso': 'info',
            'en_espera': 'warning',
            'resuelto': 'success',
            'cerrado': 'default'
        };
        return colores[estado] || 'default';
    };

    const getPrioridadColor = (prioridad) => {
        const colores = {
            'baja': 'success',
            'media': 'info',
            'alta': 'warning',
            'crítica': 'error'
        };
        return colores[prioridad] || 'default';
    };

    const handleVerDetalle = (ticket) => {
        setTicketActual(ticket);
        setOpenDetalle(true);
    };

    const handleAbrirAsignar = (ticket) => {
        setTicketActual(ticket);
        setAgenteId('');
        setOpenAsignar(true);
    };

    const handleAbrirEstado = (ticket) => {
        setTicketActual(ticket);
        setNuevoEstado(ticket.estado);
        setOpenEstado(true);
    };

    const handleAbrirPrioridad = (ticket) => {
        setTicketActual(ticket);
        setNuevaPrioridad(ticket.prioridad);
        setOpenPrioridad(true);
    };

    const handleAsignar = async () => {
        try {
            await asignarAgente(ticketActual._id, agenteId, ticketActual.empresaId._id);
            setOpenAsignar(false);
            alert('Agente asignado correctamente');
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error asignando agente:', error);
            alert('Error al asignar agente: ' + (error.response?.data?.msg || error.message));
        }
    };

    const handleCambiarEstado = async () => {
        try {
            await cambiarEstado(ticketActual._id, nuevoEstado);
            setOpenEstado(false);
            alert('Estado actualizado correctamente');
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error cambiando estado:', error);
            alert('Error al cambiar estado: ' + (error.response?.data?.msg || error.message));
        }
    };

    const handleCambiarPrioridad = async () => {
        try {
            await cambiarPrioridad(ticketActual._id, nuevaPrioridad);
            setOpenPrioridad(false);
            alert('Prioridad actualizada correctamente');
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error cambiando prioridad:', error);
            alert('Error al cambiar prioridad: ' + (error.response?.data?.msg || error.message));
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const columns = [
        {
            field: 'id',
            headerName: 'Folio',
            width: 100,
            valueGetter: (value, row) => row._id.substring(0, 8) + '...'
        },
        { field: 'titulo', headerName: 'Título', flex: 1, minWidth: 200 },
        {
            field: 'empresa',
            headerName: 'Empresa',
            width: 150,
            valueGetter: (value, row) => row.empresaId?.nombre || 'N/A'
        },
        {
            field: 'usuario',
            headerName: 'Usuario',
            width: 150,
            valueGetter: (value, row) => row.usuarioCreador?.nombre || 'N/A'
        },
        {
            field: 'estado',
            headerName: 'Estado',
            width: 130,
            renderCell: (params) => (
                <Chip
                    label={params.value.replace('_', ' ').toUpperCase()}
                    color={getEstadoColor(params.value)}
                    size="small"
                    onClick={() => handleAbrirEstado(params.row)}
                    sx={{ cursor: 'pointer' }}
                />
            )
        },
        {
            field: 'prioridad',
            headerName: 'Prioridad',
            width: 130,
            renderCell: (params) => (
                <Chip
                    label={params.value.toUpperCase()}
                    color={getPrioridadColor(params.value)}
                    size="small"
                    onClick={() => handleAbrirPrioridad(params.row)}
                    sx={{ cursor: 'pointer' }}
                />
            )
        },
        {
            field: 'agente',
            headerName: 'Agente',
            width: 150,
            renderCell: (params) => params.row.agenteAsignado?.nombre || <Typography variant="caption" color="text.secondary">Sin asignar</Typography>
        },
        {
            field: 'createdAt',
            headerName: 'Fecha',
            width: 160,
            valueFormatter: (value) => formatDate(value)
        },
        {
            field: 'actions',
            headerName: 'Acciones',
            width: 120,
            sortable: false,
            renderCell: (params) => (
                <Box>
                    <Tooltip title="Ver detalles">
                        <IconButton size="small" color="info" onClick={() => handleVerDetalle(params.row)}>
                            <VisibilityIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Asignar agente">
                        <IconButton size="small" color="primary" onClick={() => handleAbrirAsignar(params.row)}>
                            <AssignIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ];

    return (
        <Paper elevation={2} sx={{ height: 600 }}>
            <DataGrid
                rows={tickets}
                columns={columns}
                getRowId={(row) => row._id}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                    pagination: { paginationModel: { pageSize: 25 } },
                }}
                disableRowSelectionOnClick
                localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            />

            {/* Dialog de Detalles */}
            <Dialog open={openDetalle} onClose={() => setOpenDetalle(false)} maxWidth="md" fullWidth>
                <DialogTitle>Detalles del Ticket</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">Folio</Typography>
                            <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                                {ticketActual?._id}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">Título</Typography>
                            <Typography variant="body1">{ticketActual?.titulo}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">Descripción</Typography>
                            <Typography variant="body1">{ticketActual?.descripcion}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Empresa</Typography>
                            <Typography variant="body1">{ticketActual?.empresaId?.nombre}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Usuario Creador</Typography>
                            <Typography variant="body1">{ticketActual?.usuarioCreador?.nombre}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">Estado</Typography>
                            <Chip
                                label={ticketActual?.estado.replace('_', ' ').toUpperCase()}
                                color={getEstadoColor(ticketActual?.estado)}
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">Prioridad</Typography>
                            <Chip
                                label={ticketActual?.prioridad.toUpperCase()}
                                color={getPrioridadColor(ticketActual?.prioridad)}
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">Tipo</Typography>
                            <Typography variant="body1">{ticketActual?.tipo || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Agente Asignado</Typography>
                            <Typography variant="body1">{ticketActual?.agenteAsignado?.nombre || 'Sin asignar'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Tutor</Typography>
                            <Typography variant="body1">{ticketActual?.tutor?.nombre || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Fecha Creación</Typography>
                            <Typography variant="body1">{formatDate(ticketActual?.createdAt)}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Última Actualización</Typography>
                            <Typography variant="body1">{formatDate(ticketActual?.updatedAt)}</Typography>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDetalle(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de Asignar Agente */}
            <Dialog open={openAsignar} onClose={() => setOpenAsignar(false)}>
                <DialogTitle>Asignar Agente</DialogTitle>
                <DialogContent sx={{ minWidth: 400, pt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Ticket: <strong>{ticketActual?.titulo}</strong>
                    </Typography>
                    <TextField
                        fullWidth
                        label="ID del Agente"
                        value={agenteId}
                        onChange={(e) => setAgenteId(e.target.value)}
                        helperText="Ingresa el ID del usuario que será el agente"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAsignar(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleAsignar} disabled={!agenteId}>
                        Asignar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de Cambiar Estado */}
            <Dialog open={openEstado} onClose={() => setOpenEstado(false)}>
                <DialogTitle>Cambiar Estado</DialogTitle>
                <DialogContent sx={{ minWidth: 400, pt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Ticket: <strong>{ticketActual?.titulo}</strong>
                    </Typography>
                    <TextField
                        fullWidth
                        select
                        label="Nuevo Estado"
                        value={nuevoEstado}
                        onChange={(e) => setNuevoEstado(e.target.value)}
                    >
                        {estados.map(estado => (
                            <MenuItem key={estado} value={estado}>
                                {estado.replace('_', ' ').toUpperCase()}
                            </MenuItem>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEstado(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleCambiarEstado}>
                        Actualizar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de Cambiar Prioridad */}
            <Dialog open={openPrioridad} onClose={() => setOpenPrioridad(false)}>
                <DialogTitle>Cambiar Prioridad</DialogTitle>
                <DialogContent sx={{ minWidth: 400, pt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Ticket: <strong>{ticketActual?.titulo}</strong>
                    </Typography>
                    <TextField
                        fullWidth
                        select
                        label="Nueva Prioridad"
                        value={nuevaPrioridad}
                        onChange={(e) => setNuevaPrioridad(e.target.value)}
                    >
                        {prioridades.map(prioridad => (
                            <MenuItem key={prioridad} value={prioridad}>
                                {prioridad.toUpperCase()}
                            </MenuItem>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPrioridad(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleCambiarPrioridad}>
                        Actualizar
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default TicketsTable;
