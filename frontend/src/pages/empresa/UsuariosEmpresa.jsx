import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import UserManagement from '../../components/users/UserManagement'; 
import { useAuth } from '../../hooks/useAuth';

const UsuariosEmpresa = () => {
  const { user } = useAuth();
  
  if (!user) {
      return <Typography>Cargando información del usuario...</Typography>;
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Gestión de Usuarios Internos</Typography>
        <Typography variant="body2" color="text.secondary">
            Administra los usuarios pertenecientes a {user.empresaNombre || 'tu empresa'}
        </Typography>
      </Box>

      {/* Reutilizamos el componente de gestión de usuarios con el contexto de la empresa */}
      <UserManagement 
        currentUser={user} 
        empresaId={user.empresaId} 
      />
    </Container>
  );
};

export default UsuariosEmpresa;