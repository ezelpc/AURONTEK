import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Paper, Typography, TextField, Button, Alert, 
  FormControlLabel, Checkbox 
} from '@mui/material';
import { VpnKey as KeyIcon, ArrowForward } from '@mui/icons-material';
import { validarCodigoAcceso } from '../services/empresaService'; // Importamos el servicio real

const ValidarAcceso = () => {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [recordar, setRecordar] = useState(false); // Nuevo estado para el Checkbox

  // 1. EFECTO: Verificar si ya hay un código recordado al iniciar
  useEffect(() => {
    const codigoGuardado = localStorage.getItem('empresa_codigo_guardado');
    
    if (codigoGuardado) {
      // Opcional: Validar que el código guardado siga siendo válido
      validarCodigoAcceso(codigoGuardado)
        .then(() => {
          // Si es válido, lo ponemos en sesión y redirigimos
          sessionStorage.setItem('empresa_acceso', codigoGuardado);
          navigate('/empresa/login');
        })
        .catch(() => {
          // Si expiró o cambió, lo borramos para que el usuario ingrese uno nuevo
          localStorage.removeItem('empresa_codigo_guardado');
        });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // 2. Validar con el servicio (usando los datos de prueba del paso anterior)
      await validarCodigoAcceso(codigo);
      
      // Guardamos en sesión para el flujo actual
      sessionStorage.setItem('empresa_acceso', codigo); 
      
      // 3. Lógica de Recordar: Guardar o borrar de LocalStorage
      if (recordar) {
        localStorage.setItem('empresa_codigo_guardado', codigo);
      } else {
        localStorage.removeItem('empresa_codigo_guardado');
      }

      // Redirigir
      navigate('/empresa/login'); 
      
    } catch (err) {
      setError('Código de acceso inválido o expirado.');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0b2f5b' }}>
      <Paper elevation={6} sx={{ p: 5, maxWidth: 500, width: '90%', textAlign: 'center', borderRadius: 3 }}>
        <KeyIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>Acceso Empresarial</Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Ingresa el código de acceso único proporcionado en tu correo de bienvenida.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Código de Acceso"
            variant="outlined"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Ej: 6KCsUuYT"
            required
            sx={{ mb: 2 }}
          />

          {/* NUEVO: Checkbox para Recordar Código */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 3 }}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={recordar}
                  onChange={(e) => setRecordar(e.target.checked)}
                  color="primary"
                />
              }
              label={<Typography variant="body2" color="textSecondary">Recordar este código en este dispositivo</Typography>}
            />
          </Box>

          <Button 
            type="submit" 
            fullWidth 
            variant="contained" 
            size="large" 
            endIcon={<ArrowForward />}
            sx={{ py: 1.5, fontSize: '1.1rem' }}
          >
            Continuar al Login
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default ValidarAcceso;