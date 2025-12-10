import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Alert,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  People,
  ConfirmationNumber,
  Timer,
  Assignment,
  TrendingUp,
  CheckCircle
} from '@mui/icons-material';
import ticketService from '../../services/ticketService';
import estadisticasService from '../../services/estadisticasService';
import { useAuth } from '../../hooks/useAuth';
import ResolverStatsCard from '../../components/dashboard/ResolverStatsCard';
import BurnedTicketsCard from '../../components/dashboard/BurnedTicketsCard';
import RatingsCard from '../../components/dashboard/RatingsCard';

const StatCard = ({ title, value, color, icon, loading }) => (
  <Card sx={{
    borderLeft: `5px solid ${color}`,
    height: '100%',
    transition: 'transform 0.2s',
    '&:hover': { transform: 'translateY(-4px)' }
  }}>
    <CardContent>
      <Typography color="textSecondary" variant="overline" fontWeight={600}>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, justifyContent: 'space-between' }}>
        {loading ? (
          <CircularProgress size={32} />
        ) : (
          <Typography variant="h3" fontWeight="bold">{value}</Typography>
        )}
        <Box sx={{ color: color }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

const DashboardEmpresa = () => {
  const { user } = useAuth();
  const rol = user?.rol;
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Estados para estadísticas avanzadas (admin_empresa)
  const [resolverStats, setResolverStats] = useState([]);
  const [burnedTickets, setBurnedTickets] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loadingResolvers, setLoadingResolvers] = useState(false);
  const [loadingBurned, setLoadingBurned] = useState(false);
  const [loadingRatings, setLoadingRatings] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const estadisticas = await ticketService.obtenerEstadisticas();
        setStats(estadisticas);
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
        setStats({});
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // Cargar estadísticas avanzadas solo para admin_empresa
  useEffect(() => {
    if (rol !== 'admin_empresa') return;

    const loadAdvancedStats = async () => {
      try {
        // Cargar estadísticas de resolvers
        setLoadingResolvers(true);
        const resolversData = await estadisticasService.obtenerEstadisticasResolvers();
        setResolverStats(resolversData);
      } catch (error) {
        console.error('Error cargando estadísticas de resolvers:', error);
        setResolverStats([]);
      } finally {
        setLoadingResolvers(false);
      }

      try {
        // Cargar tickets quemados
        setLoadingBurned(true);
        const burnedData = await estadisticasService.obtenerTicketsQuemados();
        setBurnedTickets(burnedData);
      } catch (error) {
        console.error('Error cargando tickets quemados:', error);
        setBurnedTickets(null);
      } finally {
        setLoadingBurned(false);
      }

      try {
        // Cargar calificaciones
        setLoadingRatings(true);
        const ratingsData = await estadisticasService.obtenerCalificacionesResolvers();
        setRatings(ratingsData);
      } catch (error) {
        console.error('Error cargando calificaciones:', error);
        setRatings([]);
      } finally {
        setLoadingRatings(false);
      }
    };

    loadAdvancedStats();
  }, [rol]);

  return (
    <Box>

      {/* VISTA: ADMIN INTERNO */}
      {rol === 'admin-interno' && (
        <>
          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>Vista Admin Interno:</strong> Acceso completo al dashboard inicial. Métricas de tickets activos, en proceso, cerrados, en espera, de toda la empresa.
          </Alert>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Total Tickets"
                value={stats.total || 0}
                color="#1976d2"
                icon={<ConfirmationNumber sx={{ fontSize: 48 }} />}
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Tickets Abiertos"
                value={stats.abiertos || 0}
                color="#d32f2f"
                icon={<TrendingUp sx={{ fontSize: 48 }} />}
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                title="En Proceso"
                value={stats.enProceso || stats.en_progreso || 0}
                color="#ed6c02"
                icon={<Timer sx={{ fontSize: 48 }} />}
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Resueltos"
                value={stats.resueltos || 0}
                color="#2e7d32"
                icon={<CheckCircle sx={{ fontSize: 48 }} />}
                loading={loading}
              />
            </Grid>
          </Grid>
        </>
      )}

      {/* VISTA: ADMIN EMPRESA */}
      {rol === 'admin_empresa' && (
        <>
          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>Vista Admin Empresa:</strong> Dashboard con métricas completas de tickets, performance de resolvers y calidad de atención.
          </Alert>

          {/* Estadísticas básicas */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Total Tickets"
                value={stats.total || 0}
                color="#1976d2"
                icon={<ConfirmationNumber sx={{ fontSize: 48 }} />}
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Tickets Abiertos"
                value={stats.abiertos || 0}
                color="#d32f2f"
                icon={<TrendingUp sx={{ fontSize: 48 }} />}
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                title="En Proceso"
                value={stats.enProceso || stats.en_progreso || 0}
                color="#ed6c02"
                icon={<Timer sx={{ fontSize: 48 }} />}
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Resueltos"
                value={stats.resueltos || 0}
                color="#2e7d32"
                icon={<CheckCircle sx={{ fontSize: 48 }} />}
                loading={loading}
              />
            </Grid>
          </Grid>

          {/* Estadísticas avanzadas */}
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <ResolverStatsCard data={resolverStats} loading={loadingResolvers} />
            </Grid>
            <Grid item xs={12} lg={6}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <BurnedTicketsCard data={burnedTickets} loading={loadingBurned} />
                </Grid>
                <Grid item xs={12}>
                  <RatingsCard data={ratings} loading={loadingRatings} />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </>
      )}

      {/* VISTA: SOPORTE Y BECARIOS */}
      {(rol === 'soporte' || rol === 'beca-soporte') && (
        <>
          <Alert severity="success" sx={{ mb: 3 }}>
            <strong>Vista {rol === 'soporte' ? 'Soporte' : 'Becario Soporte'}:</strong> Métricas de tickets propios asignados.
          </Alert>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <StatCard
                title="Asignados a mí"
                value={stats.asignados || 0}
                color="#ed6c02"
                icon={<Assignment sx={{ fontSize: 48 }} />}
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard
                title="Alta Prioridad"
                value={stats.altaPrioridad || 0}
                color="#d32f2f"
                icon={<ConfirmationNumber sx={{ fontSize: 48 }} />}
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard
                title="Resueltos Hoy"
                value={stats.resueltosHoy || 0}
                color="#2e7d32"
                icon={<CheckCircle sx={{ fontSize: 48 }} />}
                loading={loading}
              />
            </Grid>
          </Grid>
        </>
      )}

      {/* VISTA: USUARIO FINAL */}
      {rol === 'usuario_final' && (
        <>
          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>Vista Usuario Final:</strong> Aquí puedes ver el estado de tus solicitudes.
          </Alert>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <StatCard
                title="Mis Tickets Abiertos"
                value={stats.misTickets || 0}
                color="#1976d2"
                icon={<ConfirmationNumber sx={{ fontSize: 48 }} />}
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <StatCard
                title="Tickets Resueltos"
                value={stats.resueltos || 0}
                color="#2e7d32"
                icon={<CheckCircle sx={{ fontSize: 48 }} />}
                loading={loading}
              />
            </Grid>
          </Grid>
        </>
      )}

      {/* VISTA: BECARIO */}
      {rol === 'becario' && (
        <>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <strong>Modo Aprendizaje:</strong> Acceso de lectura limitado.
          </Alert>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="body1" paragraph>
              No tienes métricas asignadas directamente.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Revisa la sección "Mis Tickets" para ver el historial y aprender del proceso de soporte.
            </Typography>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default DashboardEmpresa;