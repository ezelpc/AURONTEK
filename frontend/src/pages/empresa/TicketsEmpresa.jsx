import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import TicketList from '../../components/tickets/TicketList';
import { useTickets } from '../../hooks/useTickets';
import { useAuth } from '../../hooks/useAuth';

const TicketsEmpresa = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tickets, loading, loadTickets, updateFilters } = useTickets({
    empresaId: user?.empresaId
  });

  const handleRefresh = () => {
    loadTickets();
  };

  const handleFilterChange = (filters) => {
    updateFilters(filters);
  };

  const pageTitle = user?.rol === 'usuario_final' ? 'Mis Solicitudes' : 'Gestión de Tickets';

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">{pageTitle}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/empresa/tickets/nuevo')}
        >
          Nuevo Ticket
        </Button>
      </Box>

      <TicketList
        tickets={tickets}
        loading={loading}
        onRefresh={handleRefresh}
        onFilterChange={handleFilterChange}
        currentUser={user}
      />
    </Container>
  );
};

export default TicketsEmpresa;