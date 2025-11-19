import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Home as HomeIcon } from '@mui/icons-material';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', textAlign: 'center' }}>
      <Typography variant="h1" color="primary" sx={{ fontWeight: 'bold', opacity: 0.5 }}>404</Typography>
      <Typography variant="h5" gutterBottom>Página no encontrada</Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Lo sentimos, la ruta que buscas no existe o ha sido movida.
      </Typography>
      <Button variant="contained" startIcon={<HomeIcon />} onClick={() => navigate('/dashboard')}>
        Volver al Dashboard
      </Button>
    </Box>
  );
};

export default NotFound;