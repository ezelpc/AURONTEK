import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button, MenuItem, Grid, Alert,
  Card, CardContent, CardActionArea, Stack, IconButton, Chip
} from '@mui/material';
import {
  Send, ArrowBack, BugReport, Assignment,
  Computer, Wifi, VpnKey, Description, Extension, Settings,
  AttachFile, Image
} from '@mui/icons-material';
import { crearTicketEmpresa } from '../../services/empresaService';
import { CATALOGO_SERVICIOS, CATEGORIAS_SERVICIOS } from '../../constants/catalogoServicios';

const CrearTicketEmpresa = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [categoria, setCategoria] = useState('');
  const [form, setForm] = useState({
    asunto: '',
    tipo: '',
    servicioNombre: '', // Nuevo campo para el servicio específico
    prioridad: 'Media',
    descripcion: ''
  });
  const [archivo, setArchivo] = useState(null);

  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState(''); // Estado para errores de archivo
  const [enviando, setEnviando] = useState(false);

  // Handlers simplificados - Sin paso intermedio de categorías
  const handleSelectCategoria = (cat) => {
    setCategoria(cat);
    setStep(2); // Ir directo a selección de servicio
  };

  const handleSelectServicio = (servicioNombre, categoriaServicio) => {
    setForm({ ...form, servicioNombre, tipo: categoriaServicio });
    setStep(3);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate(-1);
  };

  const handleFileChange = (e) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validación de tamaño (aprox 2MB para no saturar localStorage)
      if (file.size > 2 * 1024 * 1024) {
        setError('El archivo es demasiado pesado (Máx 2MB para esta demo).');
        return;
      }
      setArchivo(file);
    }
  };

  // Función auxiliar para convertir archivo a Base64
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

    try {
      let adjuntoUrl = null;

      // Si hay archivo, lo convertimos antes de guardar
      if (archivo) {
        adjuntoUrl = await convertToBase64(archivo);
      }

      const ticketFinal = {
        ...form,
        asunto: `[${categoria}] ${form.asunto}`,
        adjunto: archivo ? archivo.name : null, // Nombre del archivo
        adjuntoUrl: adjuntoUrl // Contenido en Base64 para previsualizar
      };

      await crearTicketEmpresa(ticketFinal);

      setMensaje('Ticket creado exitosamente.');
      setEnviando(false);
      setTimeout(() => navigate('/empresa/tickets'), 1500);

    } catch (error) {
      console.error("Error al guardar:", error);
      setError('Hubo un error al procesar el ticket.');
      setEnviando(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Button startIcon={<ArrowBack />} onClick={handleBack} sx={{ mb: 2 }}>
        {step === 1 ? 'Cancelar' : 'Atrás'}
      </Button>

      <Paper elevation={3} sx={{ p: 4, minHeight: 400 }}>
        {step === 1 && (
          <>
            <Typography variant="h5" fontWeight="bold" gutterBottom align="center">¿Qué necesitas reportar?</Typography>
            <Grid container spacing={3} justifyContent="center" sx={{ mt: 2 }}>
              <Grid item xs={12} md={5}>
                <Card sx={{ border: '1px solid #d32f2f' }}>
                  <CardActionArea onClick={() => handleSelectCategoria('Incidente')} sx={{ p: 3, textAlign: 'center' }}>
                    <BugReport sx={{ fontSize: 60, color: '#d32f2f', mb: 2 }} />
                    <Typography variant="h6" fontWeight="bold" color="error">Incidente</Typography>
                    <Typography variant="body2">Algo dejó de funcionar.</Typography>
                  </CardActionArea>
                </Card>
              </Grid>
              <Grid item xs={12} md={5}>
                <Card sx={{ border: '1px solid #1976d2' }}>
                  <CardActionArea onClick={() => handleSelectCategoria('Requerimiento')} sx={{ p: 3, textAlign: 'center' }}>
                    <Assignment sx={{ fontSize: 60, color: '#1976d2', mb: 2 }} />
                    <Typography variant="h6" fontWeight="bold" color="primary">Requerimiento</Typography>
                    <Typography variant="body2">Necesito algo nuevo.</Typography>
                  </CardActionArea>
                </Card>
              </Grid>
            </Grid>
          </>
        )}

        {step === 2 && (
          <>
            <Typography variant="h5" fontWeight="bold" gutterBottom align="center">Tipo de {categoria}</Typography>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              {(categoria === 'Incidente' ? tiposIncidentes : tiposRequerimientos).map((item) => (
                <Grid item xs={6} sm={3} key={item.valor}>
                  <Card elevation={2}>
                    <CardActionArea onClick={() => handleSelectTipo(item.valor)} sx={{ p: 2, textAlign: 'center' }}>
                      <Box sx={{ color: 'text.secondary', mb: 1 }}>{item.icon}</Box>
                      <Typography variant="subtitle2" fontWeight="bold">{item.label}</Typography>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {step === 2.5 && (
          <>
            <Typography variant="h5" fontWeight="bold" gutterBottom align="center">
              Selecciona el Servicio Específico
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
              Categoría: <strong>{form.tipo}</strong>
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1, maxHeight: 400, overflowY: 'auto' }}>
              {CATALOGO_SERVICIOS[form.tipo]?.map((servicio, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card elevation={2} sx={{ height: '100%' }}>
                    <CardActionArea
                      onClick={() => handleSelectServicio(servicio.nombre)}
                      sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                    >
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>
                        {servicio.nombre}
                      </Typography>
                      {servicio.org && servicio.org !== 'NA' && (
                        <Chip label={servicio.org} size="small" variant="outlined" sx={{ mt: 'auto' }} />
                      )}
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {step === 3 && (
          <>
            <Typography variant="h5" fontWeight="bold" gutterBottom color="primary">Detalles del Ticket</Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
              <Chip label={categoria} color={categoria === 'Incidente' ? 'error' : 'primary'} />
              <Chip label={form.tipo} variant="outlined" />
              {form.servicioNombre && <Chip label={form.servicioNombre} color="success" size="small" />}
            </Stack>

            {mensaje && <Alert severity="success" sx={{ mb: 2 }}>{mensaje}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Asunto Breve" required value={form.asunto} onChange={(e) => setForm({ ...form, asunto: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth label="Prioridad" value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value })}>
                    <MenuItem value="Baja">Baja</MenuItem>
                    <MenuItem value="Media">Media</MenuItem>
                    <MenuItem value="Alta">Alta</MenuItem>
                    <MenuItem value="Critica">Crítica</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Categoría" value={form.tipo} disabled variant="filled" />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={4} label="Descripción Detallada" required value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
                </Grid>

                {/* --- SECCIÓN DE ADJUNTAR FOTO --- */}
                <Grid item xs={12}>
                  <Box sx={{ border: '1px dashed #ccc', p: 2, borderRadius: 2, textAlign: 'center', bgcolor: '#fafafa' }}>
                    <input accept="image/*" style={{ display: 'none' }} id="upload-button-file" type="file" onChange={handleFileChange} />
                    <label htmlFor="upload-button-file">
                      <Button variant="outlined" component="span" startIcon={<AttachFile />}>
                        {archivo ? 'Cambiar Imagen' : 'Adjuntar Evidencia (Foto)'}
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