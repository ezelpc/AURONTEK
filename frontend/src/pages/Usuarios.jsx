import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import UserManagement from '../components/users/UserManagement';
import { useAuth } from '../hooks/useAuth';

const Usuarios = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Usuarios
      </Typography>

      <UserManagement currentUser={user} />
    </Container>
  );
};

export default Usuarios;