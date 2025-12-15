import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, TextField, Button, MenuItem, Grid, CircularProgress, Alert, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Send as SendIcon, ArrowBack } from '@mui/icons-material';
import { getServices } from '../api/servicios';
import { useTickets } from '../hooks/useTickets';

const CrearTicket = () => {
  const navigate = useNavigate();
  const { createTicket } = useTickets();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedTipo, setSelectedTipo] = useState('');
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const [catalogScope, setCatalogScope] = useState('INTERNO'); // Default: Internal HQ

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const data = await getServices({ alcance: catalogScope });
        setServices(data);
        setError(null);
      } catch (err) {
        setError('Error al cargar el catálogo de servicios.');
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [catalogScope]);

  const handleScopeChange = (event, newScope) => {
    if (newScope !== null) {
      setCatalogScope(newScope);
      setSelectedService('');
      setSelectedTipo('');
    }
  };

  // ... existing logic



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedService || !asunto || !descripcion) {
      alert('Por favor complete todos los campos');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        titulo: asunto,
        descripcion: descripcion,
        servicioId: selectedService._id,
        servicioNombre: selectedService.nombre,
        tipo: selectedTipo,
        prioridad: selectedService.prioridad || 'media',
        // empresaId: handled by backend for Admin (defaults to null/HQ if not forced, but we want it for HQ here)
      };

      await createTicket(payload);
      alert('Ticket creado exitosamente');
      navigate('/tickets');
    } catch (err) {
      console.error(err);
      alert('Error al crear ticket');
      setLoading(false);
    }
  };

  const handleTipoChange = (event) => {
    setSelectedTipo(event.target.value);
    setSelectedService(''); // Reset service selection
  };

  const handleServiceChange = (event) => {
    const serviceId = event.target.value;
    const service = services.find(s => s._id === serviceId);
    setSelectedService(service);
  };

  const filteredServices = services.filter(s => s.tipo === selectedTipo);
  const groupedServices = filteredServices.reduce((acc, service) => {
    const { categoria } = service;
    if (!acc[categoria]) {
      acc[categoria] = [];
    }
    acc[categoria].push(service);
    return acc;
  }, {});


  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

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
          Selecciona el tipo de solicitud y el servicio afectado.
        </Typography>

        {/* Catalog Selector for Admin */}
        <Box mb={3} display="flex" justifyContent="center">
          <ToggleButtonGroup
            value={catalogScope}
            exclusive
            onChange={handleScopeChange}
            aria-label="catalogo scope"
            color="primary"
          >
            <ToggleButton value="INTERNO">Servicios Internos (HQ)</ToggleButton>
            <ToggleButton value="PLATAFORMA">Plataforma (Clientes)</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Asunto del problema"
                variant="outlined"
                placeholder="Ej: Error al facturar..."
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Tipo de Solicitud"
                value={selectedTipo}
                onChange={handleTipoChange}
              >
                <MenuItem value="Requerimiento">Requerimiento</MenuItem>
                <MenuItem value="Incidente">Incidente</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Servicio Afectado"
                value={selectedService ? selectedService._id : ''}
                onChange={handleServiceChange}
                disabled={!selectedTipo}
              >
                {selectedTipo && Object.keys(groupedServices).length > 0 ? (
                  Object.entries(groupedServices).map(([categoria, serviceList]) => ([
                    <MenuItem key={categoria} disabled>{categoria}</MenuItem>,
                    ...serviceList.map(service => (
                      <MenuItem key={service._id} value={service._id} sx={{ pl: 4 }}>
                        {service.nombre}
                      </MenuItem>
                    ))
                  ]))
                ) : (
                  <MenuItem disabled>Seleccione un tipo de solicitud primero</MenuItem>
                )}
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
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                // Si se selecciona un servicio, se puede autocompletar la prioridad
                helperText={selectedService ? `Prioridad sugerida: ${selectedService.prioridad} | SLA: ${selectedService.sla}` : ''}
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