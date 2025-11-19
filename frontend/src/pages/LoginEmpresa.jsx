import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, TextField, Button, Alert } from '@mui/material';
import { loginEmpresa } from '../services/empresaService'; // Importación correcta

const LoginEmpresa = () => {
  const navigate = useNavigate();
  const [credenciales, setCredenciales] = useState({ correo: '', contraseña: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const codigo = sessionStorage.getItem('empresa_acceso');
    if (!codigo) navigate('/acceso-empresa');
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await loginEmpresa(credenciales);
      if (res.ok) {
        // Guardamos token y usuario (que ahora trae el rol dinámico)
        localStorage.setItem('token', res.token);
        localStorage.setItem('usuario', JSON.stringify(res.usuario)); // "usuario" genérico para empresa
        navigate('/empresa/dashboard');
      }
    } catch (err) {
      setError('Credenciales incorrectas o usuario no activo.');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f0f4f8' }}>
      <Paper elevation={4} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h5" align="center" fontWeight="bold" color="primary" gutterBottom>
          Tech Solutions
        </Typography>
        <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 3 }}>
          Bienvenido al portal corporativo
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth margin="normal" label="Correo Corporativo"
            value={credenciales.correo}
            onChange={(e) => setCredenciales({...credenciales, correo: e.target.value})}
          />
          <TextField
            fullWidth margin="normal" label="Contraseña" type="password"
            value={credenciales.contraseña}
            onChange={(e) => setCredenciales({...credenciales, contraseña: e.target.value})}
          />
          <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3 }}>
            Iniciar Sesión
          </Button>
        </form>
        
        <Typography variant="caption" display="block" align="center" sx={{ mt: 2, color: '#888' }}>
          Prueba con: admin@..., soporte@..., becario@...
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoginEmpresa;