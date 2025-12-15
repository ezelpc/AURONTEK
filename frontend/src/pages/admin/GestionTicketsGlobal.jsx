import React, { useState, useEffect } from 'react';
import {
    Box, Container, Typography, Tabs, Tab, Paper, TextField, MenuItem,
    Button, InputAdornment, Grid, Chip, CircularProgress
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import TicketsTable from '../../components/admin/TicketsTable';
import { getTicketsEmpresas, getTicketsInternos } from '../../services/ticketAdminService';

const GestionTicketsGlobal = () => {
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [tickets, setTickets] = useState([]);
    const [filtros, setFiltros] = useState({
        folio: '',
        estado: '',
        prioridad: '',
        fechaInicio: '',
        fechaFin: '',
        usuario: ''
    });

    const estados = ['abierto', 'en_proceso', 'en_espera', 'resuelto', 'cerrado'];
    const prioridades = ['baja', 'media', 'alta', 'crítica'];

    const cargarTickets = async () => {
        setLoading(true);
        try {
            const filtrosLimpios = Object.fromEntries(
                Object.entries(filtros).filter(([_, v]) => v !== '')
            );

            const data = tabValue === 0
                ? await getTicketsEmpresas(filtrosLimpios)
                : await getTicketsInternos(filtrosLimpios);

            setTickets(data);
        } catch (error) {
            console.error('Error cargando tickets:', error);
            alert('Error al cargar tickets: ' + (error.response?.data?.msg || error.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarTickets();
    }, [tabValue]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setFiltros({
            folio: '',
            estado: '',
            prioridad: '',
            fechaInicio: '',
            fechaFin: '',
            usuario: ''
        });
    };

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({ ...prev, [campo]: valor }));
    };

    const handleAplicarFiltros = () => {
        cargarTickets();
    };

    const handleLimpiarFiltros = () => {
        setFiltros({
            folio: '',
            estado: '',
            prioridad: '',
            fechaInicio: '',
            fechaFin: '',
            usuario: ''
        });
    };

    const ticketsFiltrados = tickets.filter(ticket => {
        if (filtros.folio && !ticket._id.includes(filtros.folio)) return false;
        return true;
    });

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Gestión Global de Tickets
                </Typography>
                <Chip
                    label={`${ticketsFiltrados.length} tickets`}
                    color="primary"
                    sx={{ fontSize: '1rem', px: 2 }}
                />
            </Box>

            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label="Tickets de Empresas" />
                    <Tab label="Tickets Internos (Aurontek HQ)" />
                </Tabs>
            </Paper>

            {/* Filtros */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <FilterIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">Filtros</Typography>
                </Box>

                <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Buscar tickets..."
                            value={filtros.folio}
                            onChange={(e) => handleFiltroChange('folio', e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                )
                            }}
                            placeholder="Folio, título, descripción..."
                        />
                    </Grid>

                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            select
                            size="small"
                            label="Estado"
                            value={filtros.estado}
                            onChange={(e) => handleFiltroChange('estado', e.target.value)}
                        >
                            <MenuItem value="">Todos</MenuItem>
                            {estados.map(estado => (
                                <MenuItem key={estado} value={estado}>
                                    {estado.replace('_', ' ').toUpperCase()}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            select
                            size="small"
                            label="Prioridad"
                            value={filtros.prioridad}
                            onChange={(e) => handleFiltroChange('prioridad', e.target.value)}
                        >
                            <MenuItem value="">Todas</MenuItem>
                            {prioridades.map(prioridad => (
                                <MenuItem key={prioridad} value={prioridad}>
                                    {prioridad.toUpperCase()}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            type="date"
                            size="small"
                            label="Fecha Inicio"
                            value={filtros.fechaInicio}
                            onChange={(e) => handleFiltroChange('fechaInicio', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            type="date"
                            size="small"
                            label="Fecha Fin"
                            value={filtros.fechaFin}
                            onChange={(e) => handleFiltroChange('fechaFin', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    <Grid item xs={12} md={1}>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleAplicarFiltros}
                            sx={{ height: '40px' }}
                        >
                            APLICAR
                        </Button>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                        size="small"
                        startIcon={<RefreshIcon />}
                        onClick={cargarTickets}
                    >
                        Actualizar
                    </Button>
                    <Button
                        size="small"
                        onClick={handleLimpiarFiltros}
                    >
                        Limpiar Filtros
                    </Button>
                </Box>
            </Paper>

            {/* Tabla de Tickets */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <TicketsTable
                    tickets={ticketsFiltrados}
                    onUpdate={cargarTickets}
                    tipo={tabValue === 0 ? 'empresas' : 'internos'}
                />
            )}
        </Container>
    );
};

export default GestionTicketsGlobal;
