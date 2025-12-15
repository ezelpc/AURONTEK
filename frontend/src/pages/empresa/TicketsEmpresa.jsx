import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import TicketList from '../../components/tickets/TicketList';
import { useTickets } from '../../hooks/useTickets';
import { useAuth } from '../../hooks/useAuth';
import { PERMISSIONS } from '../../constants/permissions';

const TicketsEmpresa = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();

  // Determine filters based on permissions
  const getInitialFilters = () => {
    if (hasPermission(PERMISSIONS.TICKETS_VIEW_ALL)) return {};
    if (hasPermission(PERMISSIONS.TICKETS_VIEW_COMPANY)) return { empresaId: user?.empresaId };
    if (hasPermission(PERMISSIONS.TICKETS_VIEW_OWN)) return { creador: user?.id }; // Or backend handles "view_own" logic?
    return { creador: user?.id }; // Failsafe
  };

  const { tickets, loading, loadTickets, updateFilters } = useTickets(getInitialFilters());

  const handleRefresh = () => {
    loadTickets();
  };

  const handleFilterChange = (filters) => {
    updateFilters(filters);
  };

  const pageTitle = hasPermission(PERMISSIONS.TICKETS_VIEW_COMPANY) ? 'Gestión de Tickets' : 'Mis Solicitudes';

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">{pageTitle}</Typography>
        {hasPermission(PERMISSIONS.TICKETS_CREATE) && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/empresa/tickets/nuevo')}
          >
            Nuevo Ticket
          </Button>
        )}
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