import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Assessment,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  TrendingUp,
  People
} from '@mui/icons-material';
import ticketService from '../services/ticketService';
import { useAuth } from '../hooks/useAuth';

const StatCard = ({ title, value, icon, color, loading }) => (
  <Card elevation={2} sx={{ height: '100%', borderLeft: `5px solid ${color}` }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="overline">
            {title}
          </Typography>
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
          )}
        </Box>
        <Box sx={{ color: color, opacity: 0.8 }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    abiertos: 0,
    enProceso: 0,
    resueltos: 0,
    altaPrioridad: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const estadisticas = await ticketService.obtenerEstadisticas();

        setStats({
          total: estadisticas.total || 0,
          abiertos: estadisticas.abiertos || 0,
          enProceso: estadisticas.enProceso || estadisticas.en_progreso || 0,
          resueltos: estadisticas.resueltos || 0,
          altaPrioridad: estadisticas.altaPrioridad || estadisticas.alta_prioridad || 0,
        });
      } catch (err) {
        console.error('Error cargando estadísticas:', err);
        setError('No se pudieron cargar las estadísticas');
        // Usar datos de respaldo
        setStats({
          total: 0,
          abiertos: 0,
          enProceso: 0,
          resueltos: 0,
          altaPrioridad: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (!user) {
    return (
      <Alert severity="error">
        Error de autenticación. Por favor, inicia sesión nuevamente.
      </Alert>
    );
  }

  return (
    <Box>


      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total de Tickets"
            value={stats.total}
            icon={<Assessment fontSize="large" />}
            color="#1976d2"
            loading={loading}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Tickets Abiertos"
            value={stats.abiertos}
            icon={<TrendingUp fontSize="large" />}
            color="#0288d1"
            loading={loading}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="En Proceso"
            value={stats.enProceso}
            icon={<ScheduleIcon fontSize="large" />}
            color="#ed6c02"
            loading={loading}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Alta Prioridad"
            value={stats.altaPrioridad}
            icon={<WarningIcon fontSize="large" />}
            color="#d32f2f"
            loading={loading}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Resueltos"
            value={stats.resueltos}
            icon={<CheckIcon fontSize="large" />}
            color="#2e7d32"
            loading={loading}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Usuarios Activos"
            value="-"
            icon={<People fontSize="large" />}
            color="#7b1fa2"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Sección de actividad reciente */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Actividad Reciente
        </Typography>
        <Card elevation={2}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Las estadísticas se actualizan en tiempo real.
              Navega a la sección de Tickets para ver más detalles.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Dashboard;
