import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Typography, Paper, Chip, Avatar } from '@mui/material';

const columns = [
  { field: 'id', headerName: 'ID', width: 70 },
  { 
    field: 'avatar', headerName: '', width: 60,
    renderCell: () => <Avatar sx={{ width: 30, height: 30, fontSize: 14 }}>U</Avatar>
  },
  { field: 'nombre', headerName: 'Nombre Completo', width: 200 },
  { field: 'correo', headerName: 'Correo Electrónico', width: 250 },
  { 
    field: 'rol', headerName: 'Rol', width: 130,
    renderCell: (params) => (
      <Chip label={params.value} color={params.value === 'Admin' ? 'secondary' : 'primary'} size="small" variant="outlined"/>
    )
  },
  { 
    field: 'estado', headerName: 'Estado', width: 120,
    renderCell: (params) => (
        <Chip label={params.value ? 'Activo' : 'Inactivo'} color={params.value ? 'success' : 'default'} size="small" />
    )
  },
];

const rows = [
  { id: 1, nombre: 'Juan Pérez', correo: 'juan@empresa1.com', rol: 'Cliente', estado: true },
  { id: 2, nombre: 'Admin Sistema', correo: 'admin@aurontek.com', rol: 'Admin', estado: true },
  { id: 3, nombre: 'Maria López', correo: 'maria@empresa2.com', rol: 'Cliente', estado: false },
];

const Usuarios = () => {
  return (
    <Box sx={{ height: 500, width: '100%' }}>
      <Typography variant="h4" gutterBottom>Usuarios del Sistema</Typography>
      <Paper elevation={2}>
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[5, 10]}
          disableRowSelectionOnClick
        />
      </Paper>
    </Box>
  );
};

export default Usuarios;