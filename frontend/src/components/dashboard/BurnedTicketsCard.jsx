import React from 'react';
import { Card, CardContent, Typography, Box, CircularProgress, LinearProgress } from '@mui/material';
import { LocalFireDepartment, TrendingUp, TrendingDown } from '@mui/icons-material';

const BurnedTicketsCard = ({ data, loading }) => {
    if (loading) {
        return (
            <Card sx={{ height: '100%', borderLeft: '5px solid #f44336' }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Tickets Quemados
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                        <CircularProgress />
                    </Box>
                </CardContent>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card sx={{ height: '100%', borderLeft: '5px solid #f44336' }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Tickets Quemados
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                        <Typography color="textSecondary">No hay datos disponibles</Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    const { totalQuemados, resueltosQuemados, abiertosQuemados, totalConSLA, porcentaje } = data;

    return (
        <Card sx={{ height: '100%', borderLeft: '5px solid #f44336' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">Tickets Quemados</Typography>
                    <LocalFireDepartment sx={{ fontSize: 40, color: '#f44336' }} />
                </Box>

                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    Tickets que excedieron su SLA
                </Typography>

                {/* Total quemados */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h2" fontWeight="bold" color="#f44336">
                        {totalQuemados}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        de {totalConSLA} tickets con SLA definido
                    </Typography>
                </Box>

                {/* Porcentaje */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" fontWeight={500}>
                            Porcentaje de incumplimiento
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color={porcentaje > 20 ? 'error' : 'warning.main'}>
                            {porcentaje}%
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={Math.min(porcentaje, 100)}
                        sx={{
                            height: 8,
                            borderRadius: 1,
                            bgcolor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                                bgcolor: porcentaje > 20 ? '#f44336' : '#ff9800',
                            },
                        }}
                    />
                </Box>

                {/* Desglose */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, bgcolor: 'error.light', borderRadius: 1 }}>
                        <Typography variant="h4" fontWeight="bold" color="error.dark">
                            {resueltosQuemados}
                        </Typography>
                        <Typography variant="caption" color="error.dark">
                            Resueltos tarde
                        </Typography>
                    </Box>
                    <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, bgcolor: 'warning.light', borderRadius: 1 }}>
                        <Typography variant="h4" fontWeight="bold" color="warning.dark">
                            {abiertosQuemados}
                        </Typography>
                        <Typography variant="caption" color="warning.dark">
                            Abiertos vencidos
                        </Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default BurnedTicketsCard;
