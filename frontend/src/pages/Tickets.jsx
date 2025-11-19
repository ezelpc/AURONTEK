import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Typography, Paper, Chip, Button } from '@mui/material';
import { Add as AddIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom'; // Importante para navegar

const columns = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'asunto', headerName: 'Asunto', width: 250 },
  { field: 'usuario', headerName: 'Usuario', width: 150 },
  { 
    field: 'prioridad', 
    headerName: 'Prioridad', 
    width: 130,
    renderCell: (params) => {
      const color = params.value === 'Alta' ? 'error' : params.value === 'Media' ? 'warning' : 'success';
      return <Chip label={params.value} color={color} size="small" variant="outlined" />;
    }
  },
  { 
    field: 'estado', 
    headerName: 'Estado', 
    width: 130,
    renderCell: (params) => (
      <Chip 
        label={params.value} 
        color={params.value === 'Abierto' ? 'primary' : 'default'} 
        size="small" 
      />
    )
  },
  {
    field: 'acciones',
    headerName: 'Acciones',
    width: 150,
    renderCell: (params) => (
      <Button variant="contained" size="small" startIcon={<VisibilityIcon />}>
        Ver
      </Button>
    ),
  },
];

const rows = [
  { id: 1, asunto: 'Error en login', usuario: 'Juan Perez', prioridad: 'Alta', estado: 'Abierto' },
  { id: 2, asunto: 'Cambio de contraseña', usuario: 'Maria Lopez', prioridad: 'Baja', estado: 'Cerrado' },
  { id: 3, asunto: 'Pago no reflejado', usuario: 'Carlos Ruiz', prioridad: 'Media', estado: 'Abierto' },
];

const Tickets = () => {
  const navigate = useNavigate(); // Hook para navegar

  return (
    <Box sx={{ height: 500, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Gestión de Tickets</Typography>
        <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => navigate('/tickets/nuevo')} // Redirige a CrearTicket
        >
          Nuevo Ticket
        </Button>
      </Box>
      <Paper elevation={2}>
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
          pageSizeOptions={[5, 10]}
          checkboxSelection
          disableRowSelectionOnClick
        />
      </Paper>
    </Box>
  );
};

export default Tickets;