import React from 'react';
import { Card, CardContent, Typography, Box, CircularProgress, Rating } from '@mui/material';
import { Star, StarBorder } from '@mui/icons-material';

const RatingsCard = ({ data, loading }) => {
  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Calificaciones de Atención
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Calificaciones de Atención
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <Typography color="textSecondary">No hay calificaciones disponibles</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Calcular promedio general
  const promedioGeneral =
    data.reduce((sum, resolver) => sum + resolver.promedioCalificacion, 0) / data.length;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Calificaciones de Atención
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Promedio de satisfacción por resolver
        </Typography>

        {/* Promedio general */}
        <Box
          sx={{
            textAlign: 'center',
            p: 2,
            mb: 3,
            bgcolor: 'primary.light',
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" color="primary.dark" fontWeight={500}>
            Promedio General
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1 }}>
            <Typography variant="h3" fontWeight="bold" color="primary.dark">
              {promedioGeneral.toFixed(2)}
            </Typography>
            <Star sx={{ fontSize: 40, color: '#FFD700' }} />
          </Box>
          <Rating
            value={promedioGeneral}
            precision={0.1}
            readOnly
            sx={{ mt: 1 }}
            emptyIcon={<StarBorder fontSize="inherit" />}
          />
        </Box>

        {/* Lista de resolvers con calificaciones */}
        <Box>
          {data.map((resolver, index) => (
            <Box
              key={resolver._id}
              sx={{
                py: 2,
                borderBottom: index < data.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {resolver.nombre}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {resolver.totalCalificaciones} calificacion{resolver.totalCalificaciones !== 1 ? 'es' : ''}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    {resolver.promedioCalificacion.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
              <Rating
                value={resolver.promedioCalificacion}
                precision={0.1}
                readOnly
                size="small"
                emptyIcon={<StarBorder fontSize="inherit" />}
              />
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default RatingsCard;
