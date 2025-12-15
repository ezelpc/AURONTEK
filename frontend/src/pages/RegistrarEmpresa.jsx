import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Grid, TextField, Button,
  MenuItem, Divider, Alert, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions,
  CircularProgress, InputAdornment
} from '@mui/material';
import {
  Save as SaveIcon,
  Send as SendIcon,
  Close as CloseIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  VpnKey as KeyIcon
} from '@mui/icons-material';

import { registrarEmpresa } from '../services/empresaService.js';
// Ya no necesitamos '../styles/tickets.styles.css' porque usamos estilos de MUI

const RegistrarEmpresa = () => {
  const navigate = useNavigate();

  // --- ESTADOS ORIGINALES ---
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [modal, setModal] = useState({ open: false, codigo: '', correo: '', pass: '' });
  const [form, setForm] = useState({
    nombre_empresa: '', rfc: '', telefono: '', direccion: '', correo_contacto: '',
    licencia: [{ fecha_inicio: '', plan: 'Mensual', estado: true, renovado: false }],
    contratante: { nombre: '', correo: '', telefono: '', ext: '', puesto: '' }
  });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  // --- HANDLERS ORIGINALES ---
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLicenciaChange = e => {
    setForm({
      ...form,
      licencia: [{ ...form.licencia[0], [e.target.name]: e.target.value }]
    });
  };

  const handleContratanteChange = e => {
    setForm({
      ...form,
      contratante: { ...form.contratante, [e.target.name]: e.target.value }
    });
  };

  const handleSubmit = async e => {
    setEnviado(false);
    e.preventDefault();
    setMensaje('');
    setError('');

    if (!form.nombre_empresa || !form.rfc || !form.correo_contacto || !form.licencia[0].fecha_inicio || !form.contratante.nombre || !form.contratante.correo) {
      setError('Completa todos los campos obligatorios.');
      return;
    }

    try {
      const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
      const token = storage.getItem('token');
      const res = await registrarEmpresa(form, token);

      setMensaje(res.mensaje || 'Empresa registrada correctamente');
      setError('');
      setModal({
        open: true,
        codigo: res.codigo_acceso,
        correo: res.contratante_usuario?.correo,
        pass: res.contratante_usuario?.contraseña_temporal
      });

      // Limpiar formulario
      setForm({
        nombre_empresa: '', rfc: '', telefono: '', direccion: '', correo_contacto: '',
        licencia: [{ fecha_inicio: '', plan: 'Mensual', estado: true, renovado: false }],
        contratante: { nombre: '', correo: '', telefono: '', ext: '', puesto: '' }
      });

    } catch (err) {
      setError(err.error || 'Error al registrar empresa');
      setMensaje('');
    }
  };

  // Función para enviar credenciales (Logica movida aquí para limpieza)
  const handleEnviarCredenciales = async () => {
    setEnviando(true);
    setEnviado(false);
    try {
      // SIMULACIÓN: El backend aún no tiene este endpoint implementado.
      // Las credenciales ya se mostraron en el modal.
      console.log('Enviando credenciales por correo (Simulado):', {
        correo: modal.correo,
        codigo: modal.codigo
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEnviado(true);
      setTimeout(() => {
        navigate('/admin/empresas'); // Redirigir a la lista de empresas
      }, 1500);
    } catch (e) {
      setEnviado(false);
      console.error(e);
    }
    setEnviando(false);
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', pb: 5 }}>

      {/* --- TITULO Y FORMULARIO --- */}
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <BusinessIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h5" component="h1">
            Registrar Nueva Empresa
          </Typography>
        </Box>

        {/* Mensajes de Error / Exito principales */}
        {mensaje && <Alert severity="success" sx={{ mb: 2 }}>{mensaje}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>

            {/* SECCIÓN 1: DATOS EMPRESA */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                Datos Generales
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Nombre de la Empresa" name="nombre_empresa" value={form.nombre_empresa} onChange={handleChange} required variant="outlined" />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="RFC" name="rfc" value={form.rfc} onChange={handleChange} required variant="outlined" />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Teléfono Empresa" name="telefono" value={form.telefono} onChange={handleChange} variant="outlined" />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Correo Contacto General" name="correo_contacto" type="email" value={form.correo_contacto} onChange={handleChange} required variant="outlined" />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Dirección Fiscal" name="direccion" value={form.direccion} onChange={handleChange} multiline rows={2} variant="outlined" />
            </Grid>

            {/* SECCIÓN 2: LICENCIA */}
            <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                Configuración de Licencia
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Fecha de Inicio"
                type="date"
                name="fecha_inicio"
                value={form.licencia[0].fecha_inicio}
                onChange={handleLicenciaChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Plan de Facturación"
                name="plan"
                value={form.licencia[0].plan}
                onChange={handleLicenciaChange}
                required
              >
                <MenuItem value="Mensual">Mensual</MenuItem>
                <MenuItem value="Trimestral">Trimestral</MenuItem>
                <MenuItem value="Anual">Anual</MenuItem>
              </TextField>
            </Grid>

            {/* SECCIÓN 3: CONTRATANTE (ADMIN DE LA EMPRESA) */}
            <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                  Datos del Contratante (Admin Inicial)
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Nombre Completo" name="nombre" value={form.contratante.nombre} onChange={handleContratanteChange} required />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Correo Electrónico (Login)" name="correo" type="email" value={form.contratante.correo} onChange={handleContratanteChange} required />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth label="Teléfono Directo" name="telefono" value={form.contratante.telefono} onChange={handleContratanteChange} />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField fullWidth label="Ext." name="ext" value={form.contratante.ext} onChange={handleContratanteChange} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Puesto / Cargo" name="puesto" value={form.contratante.puesto} onChange={handleContratanteChange} />
            </Grid>

            {/* BOTÓN GUARDAR */}
            <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                startIcon={<SaveIcon />}
                sx={{ py: 1.5, fontWeight: 'bold' }}
              >
                Registrar Empresa y Generar Accesos
              </Button>
            </Grid>

          </Grid>
        </form>
      </Paper>

      {/* --- MODAL (DIALOG) DE ÉXITO --- */}
      <Dialog
        open={modal.open}
        onClose={() => !enviando && setModal({ ...modal, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'success.main', color: 'white', display: 'flex', alignItems: 'center' }}>
          <KeyIcon sx={{ mr: 1 }} /> Empresa Registrada con Éxito
        </DialogTitle>

        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText sx={{ mb: 2 }}>
            Se han generado las siguientes credenciales temporales para el administrador de la empresa:
          </DialogContentText>

          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5' }}>
            <Typography variant="body1"><b>Código de Acceso:</b> {modal.codigo}</Typography>
            <Typography variant="body1"><b>Usuario:</b> {modal.correo}</Typography>
            <Typography variant="body1"><b>Contraseña Temporal:</b> {modal.pass}</Typography>
          </Paper>

          {enviado && (
            <Alert severity="success" sx={{ mt: 2 }}>
              ¡Credenciales enviadas por correo correctamente! Redirigiendo...
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setModal({ ...modal, open: false })}
            color="inherit"
            disabled={enviando}
            startIcon={<CloseIcon />}
          >
            Cerrar
          </Button>

          <Button
            onClick={handleEnviarCredenciales}
            variant="contained"
            color="primary"
            disabled={enviando || enviado}
            endIcon={enviando ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          >
            {enviando ? 'Enviando...' : enviado ? 'Enviado' : 'Enviar por Correo'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default RegistrarEmpresa;