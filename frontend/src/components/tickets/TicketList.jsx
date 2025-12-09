import React, { useState } from 'react';
import {
    Box,
    Paper,
    TextField,
    MenuItem,
    IconButton,
    Chip,
    Tooltip,
    Button,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useNavigate } from 'react-router-dom';

/**
 * Lista de tickets con DataGrid
 * @param {Object} props
 * @param {Array} props.tickets - Lista de tickets
 * @param {boolean} props.loading - Estado de carga
 * @param {Function} props.onRefresh - Callback para refrescar
 * @param {Function} props.onFilterChange - Callback para cambiar filtros
 * @param {Object} props.currentUser - Usuario actual
 */
const TicketList = ({
    tickets = [],
    loading = false,
    onRefresh,
    onFilterChange,
    currentUser,
}) => {
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('all');
    const [prioridadFilter, setPrioridadFilter] = useState('all');

    // Definir columnas
    const columns = [
        {
            field: 'folio',
            headerName: 'Folio',
            width: 120,
            renderCell: (params) => (
                <Chip
                    label={params.value || `#${params.row._id?.slice(-6)}`}
                    size="small"
                    variant="outlined"
                />
            ),
        },
        {
            field: 'titulo',
            headerName: 'Título',
            flex: 1,
            minWidth: 200,
        },
        {
            field: 'estado',
            headerName: 'Estado',
            width: 130,
            renderCell: (params) => {
                const colorMap = {
                    'abierto': 'info',
                    'en_progreso': 'warning',
                    'resuelto': 'success',
                    'cerrado': 'default',
                    'pendiente': 'error',
                };
                return (
                    <Chip
                        label={params.value?.replace('_', ' ').toUpperCase()}
                        color={colorMap[params.value] || 'default'}
                        size="small"
                    />
                );
            },
        },
        {
            field: 'prioridad',
            headerName: 'Prioridad',
            width: 120,
            renderCell: (params) => {
                const colorMap = {
                    'baja': 'success',
                    'media': 'warning',
                    'alta': 'error',
                    'critica': 'error',
                };
                return (
                    <Chip
                        label={params.value?.toUpperCase()}
                        color={colorMap[params.value?.toLowerCase()] || 'default'}
                        size="small"
                    />
                );
            },
        },
        {
            field: 'categoria',
            headerName: 'Categoría',
            width: 150,
        },
        {
            field: 'agenteAsignado',
            headerName: 'Asignado a',
            width: 150,
            valueGetter: (params) => params.row.agenteAsignado?.nombre || 'Sin asignar',
        },
        {
            field: 'createdAt',
            headerName: 'Fecha',
            width: 120,
            valueGetter: (params) => {
                const date = new Date(params.value);
                return date.toLocaleDateString('es-MX');
            },
        },
        {
            field: 'actions',
            headerName: 'Acciones',
            width: 100,
            sortable: false,
            renderCell: (params) => (
                <Box>
                    <Tooltip title="Ver detalle">
                        <IconButton
                            size="small"
                            onClick={() => navigate(`/tickets/${params.row._id}`)}
                        >
                            <VisibilityIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    // Filtrar tickets
    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch =
            !searchText ||
            ticket.titulo?.toLowerCase().includes(searchText.toLowerCase()) ||
            ticket.descripcion?.toLowerCase().includes(searchText.toLowerCase()) ||
            ticket.folio?.toLowerCase().includes(searchText.toLowerCase());

        const matchesEstado =
            estadoFilter === 'all' || ticket.estado === estadoFilter;

        const matchesPrioridad =
            prioridadFilter === 'all' || ticket.prioridad?.toLowerCase() === prioridadFilter;

        return matchesSearch && matchesEstado && matchesPrioridad;
    });

    // Manejar cambio de filtros
    const handleFilterChange = () => {
        if (onFilterChange) {
            onFilterChange({
                estado: estadoFilter !== 'all' ? estadoFilter : undefined,
                prioridad: prioridadFilter !== 'all' ? prioridadFilter : undefined,
                search: searchText || undefined,
            });
        }
    };

    return (
        <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
            {/* Filtros */}
            <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                    placeholder="Buscar tickets..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    size="small"
                    sx={{ minWidth: 250 }}
                    InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                />

                <TextField
                    select
                    label="Estado"
                    value={estadoFilter}
                    onChange={(e) => setEstadoFilter(e.target.value)}
                    size="small"
                    sx={{ minWidth: 150 }}
                >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="abierto">Abierto</MenuItem>
                    <MenuItem value="en_progreso">En Progreso</MenuItem>
                    <MenuItem value="pendiente">Pendiente</MenuItem>
                    <MenuItem value="resuelto">Resuelto</MenuItem>
                    <MenuItem value="cerrado">Cerrado</MenuItem>
                </TextField>

                <TextField
                    select
                    label="Prioridad"
                    value={prioridadFilter}
                    onChange={(e) => setPrioridadFilter(e.target.value)}
                    size="small"
                    sx={{ minWidth: 150 }}
                >
                    <MenuItem value="all">Todas</MenuItem>
                    <MenuItem value="baja">Baja</MenuItem>
                    <MenuItem value="media">Media</MenuItem>
                    <MenuItem value="alta">Alta</MenuItem>
                    <MenuItem value="critica">Crítica</MenuItem>
                </TextField>

                <Button
                    variant="outlined"
                    startIcon={<FilterListIcon />}
                    onClick={handleFilterChange}
                    size="small"
                >
                    Aplicar Filtros
                </Button>

                <Tooltip title="Refrescar">
                    <IconButton onClick={onRefresh} size="small">
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>

                <Box sx={{ ml: 'auto' }}>
                    <Chip
                        label={`${filteredTickets.length} tickets`}
                        color="primary"
                        variant="outlined"
                    />
                </Box>
            </Box>

            {/* DataGrid */}
            <Box sx={{ flex: 1, minHeight: 400 }}>
                <DataGrid
                    rows={filteredTickets}
                    columns={columns}
                    loading={loading}
                    getRowId={(row) => row._id}
                    pageSizeOptions={[10, 25, 50, 100]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 25 } },
                    }}
                    disableRowSelectionOnClick
                    sx={{
                        '& .MuiDataGrid-row:hover': {
                            cursor: 'pointer',
                        },
                    }}
                    onRowClick={(params) => navigate(`/tickets/${params.row._id}`)}
                />
            </Box>
        </Paper>
    );
};

export default TicketList;
