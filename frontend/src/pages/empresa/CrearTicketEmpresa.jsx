import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button, MenuItem, Grid, Alert,
  Card, CardContent, CardActionArea, Stack, IconButton, Chip, CircularProgress, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  Send, ArrowBack, BugReport, Assignment,
  AttachFile, Image, ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import api from '../../api/api';
import { getServices } from '../../api/servicios';
import { getCategoryIcon, getTypeIcon } from '../../constants/serviceCatalogIcons';

const CrearTicketEmpresa = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [tipo, setTipo] = useState('');

  const [form, setForm] = useState({
    titulo: '',
    servicioId: '',
    servicioNombre: '',
    prioridad: 'media',
    descripcion: ''
  });

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const [archivo, setArchivo] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [formError, setFormError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await getServices({ alcance: 'PLATAFORMA' });
        setServices(data);
      } catch (err) {
        console.error('Error loading services:', err);
        setApiError('Error al cargar el catálogo de servicios. Por favor, recargue la página.');
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const handleSelectTipo = (selectedTipo) => {
    setTipo(selectedTipo);
    setStep(2);
  };

  // Helper to map service priority (e.g. "Alta") to ticket priority (e.g. "alta")
  const mapPriority = (p) => {
    if (!p) return 'media';
    const lower = p.toLowerCase();
    if (lower === 'critica' || lower === 'crítica') return 'crítica';
    return lower; // baja, media, alta
  };

  const handleSelectServicio = (servicio) => {
    setForm({
      ...form,
      servicioId: servicio._id,
      servicioNombre: servicio.nombre,
      prioridad: mapPriority(servicio.prioridad)
    });
    setStep(3);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate(-1);
  };

  const handleFileChange = (e) => {
    setFormError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setFormError('El archivo es demasiado pesado (Máx 2MB).');
        return;
      }
      setArchivo(file);
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setFormError('');

    try {
      let adjuntos = [];
      if (archivo) {
        const adjuntoUrl = await convertToBase64(archivo);
        adjuntos = [{
          nombre: archivo.name,
          url: adjuntoUrl,
          tipo: archivo.type
        }];
      }

      // Asignar prioridad por defecto si no existe
      const prioridadMap = {
        'alta': 'alta', 'media': 'media', 'baja': 'baja', 'critica': 'crítica', 'crítica': 'crítica'
      };

      const priorityToSend = prioridadMap[form.prioridad.toLowerCase()] || 'media';
      const tipoToSend = tipo.toLowerCase();

      // Auto-generate title: [Date] [Service] - [Type]
      const dateStr = new Date().toISOString().split('T')[0];
      const serviceName = form.servicioNombre || 'General';
      const autoTitle = `[${dateStr}] ${serviceName} - ${tipo}`;

      const ticketData = {
        titulo: autoTitle, // Auto-assigned
        descripcion: form.descripcion,
        servicioId: form.servicioId,
        servicioNombre: form.servicioNombre,
        tipo: tipoToSend,
        prioridad: priorityToSend,
        adjuntos
      };

      await api.post('/tickets', ticketData);
      setMensaje('Ticket creado exitosamente.');
      setEnviando(false);
      setTimeout(() => navigate('/empresa/tickets'), 1500);

    } catch (error) {
      console.error("Error al guardar:", error);
      setFormError(error.response?.data?.msg || 'Hubo un error al procesar el ticket.');
      setEnviando(false);
    }
  };

  const filteredServices = services.filter(s => s.tipo === tipo);
  const groupedServices = filteredServices.reduce((acc, service) => {
    const { categoria } = service;
    if (!acc[categoria]) {
      acc[categoria] = [];
    }
    acc[categoria].push(service);
    return acc;
  }, {});

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (apiError) {
    return <Alert severity="error">{apiError}</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Button startIcon={<ArrowBack />} onClick={handleBack} sx={{ mb: 2 }}>
        {step === 1 ? 'Cancelar' : 'Atrás'}
      </Button>

      <Paper elevation={3} sx={{ p: 4, minHeight: 400 }}>
        {step === 1 && (
          <>
            <Typography variant="h4" fontWeight="800" gutterBottom align="center" sx={{ mb: 4, background: 'linear-gradient(45deg, #1e293b, #3b82f6)', backgroundClip: 'text', color: 'transparent' }}>
              ¿Qué necesitas reportar?
            </Typography>
            <Grid container spacing={4} justifyContent="center" sx={{ mt: 1 }}>
              <Grid item xs={12} md={5}>
                <Card
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 4,
                    overflow: 'visible',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 20px 40px -15px rgba(239, 68, 68, 0.3)', borderColor: '#ef4444' }
                  }}
                >
                  <CardActionArea
                    onClick={() => handleSelectTipo('Incidente')}
                    sx={{ p: 4, textAlign: 'center', height: '100%' }}
                  >
                    <Box sx={{
                      width: 80, height: 80, borderRadius: '50%', mx: 'auto', mb: 3,
                      background: 'linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#ef4444'
                    }}>
                      <BugReport sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#ef4444', mb: 1 }}>Incidente</Typography>
                    <Typography variant="body1" color="text.secondary">Algo dejó de funcionar o presenta errores.</Typography>
                  </CardActionArea>
                </Card>
              </Grid>
              <Grid item xs={12} md={5}>
                <Card
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 4,
                    overflow: 'visible',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 20px 40px -15px rgba(59, 130, 246, 0.3)', borderColor: '#3b82f6' }
                  }}
                >
                  <CardActionArea
                    onClick={() => handleSelectTipo('Requerimiento')}
                    sx={{ p: 4, textAlign: 'center', height: '100%' }}
                  >
                    <Box sx={{
                      width: 80, height: 80, borderRadius: '50%', mx: 'auto', mb: 3,
                      background: 'linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#3b82f6'
                    }}>
                      <Assignment sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#3b82f6', mb: 1 }}>Requerimiento</Typography>
                    <Typography variant="body1" color="text.secondary">Necesito una nueva funcionalidad o acceso.</Typography>
                  </CardActionArea>
                </Card>
              </Grid>
            </Grid>
          </>
        )}

        {step === 2 && (
          <>
            <Typography variant="h5" fontWeight="bold" gutterBottom align="center">
              Selecciona un Servicio de tipo "{tipo}"
            </Typography>
            <Box sx={{ mt: 3, maxHeight: 500, overflowY: 'auto' }}>
              {Object.entries(groupedServices).map(([categoria, serviceList]) => {
                const iconConfig = getCategoryIcon(categoria);
                const IconComponent = iconConfig.icon;

                return (
                  <Accordion key={categoria} defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <IconComponent sx={{ mr: 1, color: iconConfig.color }} />
                      <Typography fontWeight="bold">{categoria}</Typography>
                      <Chip label={serviceList.length} size="small" sx={{ ml: 'auto', mr: 2 }} />
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        {serviceList.map((service) => (
                          <Grid item xs={12} sm={6} md={4} key={service._id}>
                            <Card
                              elevation={2}
                              sx={{
                                height: '100%',
                                '&:hover': {
                                  boxShadow: 4,
                                  transform: 'translateY(-2px)',
                                  transition: 'all 0.2s'
                                }
                              }}
                            >
                              <CardActionArea
                                onClick={() => handleSelectServicio(service)}
                                sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between' }}
                              >
                                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                                  {service.nombre}
                                </Typography>
                                <Stack direction="row" spacing={0.5} sx={{ mt: 'auto', flexWrap: 'wrap', gap: 0.5 }}>
                                  <Chip label={`SLA: ${service.sla}`} size="small" variant="outlined" />
                                  {service.prioridad && (
                                    <Chip
                                      label={service.prioridad}
                                      size="small"
                                      color={service.prioridad === 'Alta' || service.prioridad === 'critica' ? 'error' : 'default'}
                                    />
                                  )}
                                </Stack>
                              </CardActionArea>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          </>
        )}

        {step === 3 && (
          <>
            <Typography variant="h5" fontWeight="bold" gutterBottom color="primary">Detalles del Ticket</Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
              <Chip label={tipo} color={tipo === 'Incidente' ? 'error' : 'primary'} />
              {form.servicioNombre && <Chip label={form.servicioNombre} color="success" />}
            </Stack>

            {mensaje && <Alert severity="success" sx={{ mb: 2 }}>{mensaje}</Alert>}
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                {/* Title Field Removed - Auto Generated */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Prioridad"
                    value={form.prioridad}
                    onChange={(e) => setForm({ ...form, prioridad: e.target.value })}
                  >
                    <MenuItem value="baja">Baja</MenuItem>
                    <MenuItem value="media">Media</MenuItem>
                    <MenuItem value="alta">Alta</MenuItem>
                    <MenuItem value="crítica">Crítica</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Servicio" value={form.servicioNombre} disabled variant="filled" />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Descripción Detallada"
                    required
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ border: '1px dashed #ccc', p: 2, borderRadius: 2, textAlign: 'center', bgcolor: '#fafafa' }}>
                    <input accept="image/*" style={{ display: 'none' }} id="upload-button-file" type="file" onChange={handleFileChange} />
                    <label htmlFor="upload-button-file">
                      <Button variant="outlined" component="span" startIcon={<AttachFile />}>
                        {archivo ? 'Cambiar Evidencia' : 'Adjuntar Evidencia (Foto)'}
                      </Button>
                    </label>
                    {archivo && (
                      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'success.main' }}>
                        <Image fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="body2">{archivo.name}</Typography>
                        <IconButton size="small" onClick={() => setArchivo(null)} color="error" sx={{ ml: 1 }}>
                          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>&times;</span>
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Button type="submit" variant="contained" fullWidth size="large" endIcon={<Send />} disabled={enviando}>
                    {enviando ? 'Guardando...' : 'Levantar Ticket'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default CrearTicketEmpresa;