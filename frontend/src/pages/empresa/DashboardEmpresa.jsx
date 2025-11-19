import React from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Alert } from '@mui/material';
import { People, ConfirmationNumber, Timer, Assignment } from '@mui/icons-material';

const StatCard = ({ title, value, color, icon }) => (
  <Card sx={{ borderLeft: `5px solid ${color}`, height: '100%' }}>
    <CardContent>
      <Typography color="textSecondary" variant="overline">{title}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
        <Box sx={{ color: color, mr: 2 }}>{icon}</Box>
        <Typography variant="h4">{value}</Typography>
      </Box>
    </CardContent>
  </Card>
);

const DashboardEmpresa = () => {
  const user = JSON.parse(localStorage.getItem('usuario') || '{}');
  const rol = user.rol;

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Panel de Control
      </Typography>

      {/* VISTA: ADMIN EMPRESA */}
      {rol === 'admin_empresa' && (
        <>
          <Alert severity="info" sx={{ mb: 3 }}>Vista Gerencial: Tienes acceso completo a métricas y usuarios.</Alert>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <StatCard title="Total Usuarios" value="24" color="#1976d2" icon={<People fontSize="large"/>} />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard title="Tickets Activos" value="8" color="#d32f2f" icon={<ConfirmationNumber fontSize="large"/>} />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard title="Tiempo Promedio" value="2h" color="#2e7d32" icon={<Timer fontSize="large"/>} />
            </Grid>
          </Grid>
        </>
      )}

      {/* VISTA: SOPORTE */}
      {rol === 'soporte' && (
        <>
          <Alert severity="success" sx={{ mb: 3 }}>Vista Técnico: Tickets asignados y pendientes de resolución.</Alert>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <StatCard title="Asignados a mí" value="5" color="#ed6c02" icon={<Assignment fontSize="large"/>} />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard title="Alta Prioridad" value="2" color="#d32f2f" icon={<ConfirmationNumber fontSize="large"/>} />
            </Grid>
          </Grid>
        </>
      )}

      {/* VISTA: USUARIO FINAL */}
      {rol === 'usuario_final' && (
        <>
          <Alert severity="info" sx={{ mb: 3 }}>Bienvenido. Aquí puedes ver el estado de tus solicitudes.</Alert>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <StatCard title="Mis Tickets Abiertos" value="1" color="#1976d2" icon={<ConfirmationNumber fontSize="large"/>} />
            </Grid>
            <Grid item xs={12} md={6}>
              <StatCard title="Última Respuesta" value="Hace 1h" color="#2e7d32" icon={<Timer fontSize="large"/>} />
            </Grid>
          </Grid>
        </>
      )}

      {/* VISTA: BECARIO */}
      {rol === 'becario' && (
        <>
          <Alert severity="warning" sx={{ mb: 3 }}>Modo Aprendizaje: Acceso de lectura limitado.</Alert>
          <Typography>No tienes métricas asignadas. Revisa la sección "Mis Tickets" para ver el historial.</Typography>
        </>
      )}
    </Box>
  );
};

export default DashboardEmpresa;