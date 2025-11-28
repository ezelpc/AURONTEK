import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Avatar, Grid, Divider, Alert } from '@mui/material';
import { Save as SaveIcon, AccountCircle } from '@mui/icons-material';

const Perfil = () => {
  const [mensaje, setMensaje] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí iría la lógica de actualización con axios
    setMensaje('Perfil actualizado correctamente (Simulado)');
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ width: 60, height: 60, mr: 2, bgcolor: 'primary.main' }}>
            <AccountCircle fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h5">Mi Perfil</Typography>
            <Typography variant="body2" color="textSecondary">Administra tu información personal</Typography>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />

        {mensaje && <Alert severity="success" sx={{ mb: 3 }}>{mensaje}</Alert>}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Nombre Completo" defaultValue="Admin Aurontek" variant="outlined" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Correo Electrónico" defaultValue="admin@aurontek.com" disabled variant="outlined" helperText="El correo no se puede cambiar" />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Cambiar Contraseña (Opcional)</Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField fullWidth type="password" label="Nueva Contraseña" variant="outlined" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth type="password" label="Confirmar Nueva Contraseña" variant="outlined" />
            </Grid>

            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="contained" startIcon={<SaveIcon />} size="large">
                Guardar Cambios
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default Perfil;