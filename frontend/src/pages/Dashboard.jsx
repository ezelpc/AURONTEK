import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Button
} from '@mui/material';
import {
  Assessment, Warning as WarningIcon, CheckCircle as CheckIcon,
  People
} from '@mui/icons-material';
import ticketService from '../services/ticketService';
import { getTodasEmpresas } from '../services/empresaService';
import { useAuth } from '../hooks/useAuth';
import EmpresasTable from '../components/admin/EmpresasTable';

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
  const [stats, setStats] = useState({ total: 0, abiertos: 0, enProceso: 0, resueltos: 0, altaPrioridad: 0 });
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [est, emp] = await Promise.all([
        ticketService.obtenerEstadisticas(),
        getTodasEmpresas()
      ]);

      setStats({
        total: est.total || 0,
        abiertos: est.abiertos || 0,
        enProceso: est.enProceso || est.en_progreso || 0,
        resueltos: est.resueltos || 0,
        altaPrioridad: est.altaPrioridad || est.alta_prioridad || 0,
      });
      setEmpresas(emp);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Error al cargar datos del sistema.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);



  if (!user) return <Alert severity="error">Error de autenticación.</Alert>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Panel de Administración General
      </Typography>

      {error && <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Tickets" value={stats.total} icon={<Assessment fontSize="large" />} color="#1976d2" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Empresas Activas" value={empresas.length} icon={<People fontSize="large" />} color="#7b1fa2" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Alta Prioridad" value={stats.altaPrioridad} icon={<WarningIcon fontSize="large" />} color="#d32f2f" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Resueltos" value={stats.resueltos} icon={<CheckIcon fontSize="large" />} color="#2e7d32" loading={loading} />
        </Grid>
      </Grid>

      {/* Companies Table */}
      <Typography variant="h5" sx={{ mb: 2 }}>Gestión de Empresas y Accesos</Typography>
      <EmpresasTable empresas={empresas} loading={loading} onUpdate={fetchData} />

    </Box>
  );
};

export default Dashboard;
