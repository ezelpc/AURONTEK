import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, TextField, Button, MenuItem, Grid } from '@mui/material';
import { Send as SendIcon, ArrowBack } from '@mui/icons-material';

const CrearTicket = () => {
  const navigate = useNavigate();
  const [prioridad, setPrioridad] = useState('Media');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Ticket creado (Simulación)");
    navigate('/tickets'); // Regresa a la lista
  };

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto' }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Volver
      </Button>
      
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Nuevo Ticket de Soporte
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Describe el incidente con el mayor detalle posible para asignarlo al agente correcto.
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField fullWidth required label="Asunto del problema" variant="outlined" placeholder="Ej: Error al facturar..." />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Tipo de Incidencia" defaultValue="Soporte Técnico">
                <MenuItem value="Soporte Técnico">Soporte Técnico</MenuItem>
                <MenuItem value="Facturación">Facturación</MenuItem>
                <MenuItem value="Acceso">Acceso / Login</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField 
                select 
                fullWidth 
                label="Prioridad" 
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value)}
              >
                <MenuItem value="Baja">Baja</MenuItem>
                <MenuItem value="Media">Media</MenuItem>
                <MenuItem value="Alta">Alta</MenuItem>
                <MenuItem value="Crítica">Crítica</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Descripción detallada"
                multiline
                rows={5}
                variant="outlined"
                placeholder="Explica paso a paso cómo reproducir el error..."
              />
            </Grid>

            <Grid item xs={12}>
              <Button type="submit" variant="contained" fullWidth size="large" startIcon={<SendIcon />}>
                Enviar Ticket
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default CrearTicket;