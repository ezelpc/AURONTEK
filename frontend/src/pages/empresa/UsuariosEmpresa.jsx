import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Button, Dialog, DialogTitle, 
  DialogContent, TextField, DialogActions, MenuItem, Chip 
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, PersonAdd } from '@mui/icons-material';
import { getUsuariosEmpresa, crearUsuarioEmpresa } from '../../services/empresaService';

const UsuariosEmpresa = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [open, setOpen] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: '', correo: '', rol: 'Usuario' });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    const data = await getUsuariosEmpresa();
    setUsuarios(data);
  };

  const handleCrear = async () => {
    await crearUsuarioEmpresa(nuevoUsuario);
    setOpen(false);
    // En un caso real, recargarías la lista o agregarías el usuario al estado
    setUsuarios([...usuarios, { id: Date.now(), ...nuevoUsuario, estado: true }]);
    setNuevoUsuario({ nombre: '', correo: '', rol: 'Usuario' });
  };

  const columns = [
    { field: 'nombre', headerName: 'Nombre', flex: 1 },
    { field: 'correo', headerName: 'Correo', flex: 1 },
    { field: 'rol', headerName: 'Rol', width: 150 },
    { 
      field: 'estado', headerName: 'Estado', width: 120,
      renderCell: (params) => <Chip label={params.value ? 'Activo' : 'Inactivo'} color="success" size="small" variant="outlined" />
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Usuarios Internos</Typography>
        <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setOpen(true)}>
          Agregar Usuario
        </Button>
      </Box>

      <Paper elevation={2} sx={{ height: 400, width: '100%' }}>
        <DataGrid rows={usuarios} columns={columns} pageSize={5} disableSelectionOnClick />
      </Paper>

      {/* Modal Crear Usuario */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Nuevo Usuario Interno</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus margin="dense" label="Nombre Completo" fullWidth variant="outlined"
            value={nuevoUsuario.nombre}
            onChange={(e) => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})}
          />
          <TextField
            margin="dense" label="Correo Electrónico" type="email" fullWidth variant="outlined"
            value={nuevoUsuario.correo}
            onChange={(e) => setNuevoUsuario({...nuevoUsuario, correo: e.target.value})}
          />
          <TextField
            select margin="dense" label="Rol / Permisos" fullWidth variant="outlined"
            value={nuevoUsuario.rol}
            onChange={(e) => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})}
          >
            <MenuItem value="Admin">Admin (Gerente)</MenuItem>
            <MenuItem value="Soporte">Soporte Técnico (Interno)</MenuItem>
            <MenuItem value="Usuario">Usuario Básico</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleCrear} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsuariosEmpresa;