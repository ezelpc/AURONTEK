import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import { Assessment, Warning as WarningIcon, CheckCircle as CheckIcon, Schedule as ScheduleIcon } from '@mui/icons-material';

const StatCard = ({ title, value, icon, color }) => (
  <Card elevation={2} sx={{ height: '100%', borderLeft: `5px solid ${color}` }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="overline">{title}</Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{value}</Typography>
        </Box>
        <Box sx={{ color: color, opacity: 0.8 }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin') || sessionStorage.getItem('admin');
    if (storedAdmin) setAdmin(JSON.parse(storedAdmin));
  }, []);

  if (!admin) return <Typography color="error">Error de autenticación.</Typography>;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>Hola, {admin.nombre}</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Tickets Asignados" value="12" icon={<Assessment fontSize="large" />} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Alta Prioridad" value="3" icon={<WarningIcon fontSize="large" />} color="#d32f2f" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="En Proceso" value="5" icon={<ScheduleIcon fontSize="large" />} color="#ed6c02" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Resueltos (Mes)" value="28" icon={<CheckIcon fontSize="large" />} color="#2e7d32" />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
