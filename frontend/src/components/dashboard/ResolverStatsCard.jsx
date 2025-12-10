import React from 'react';
import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Person } from '@mui/icons-material';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

const ResolverStatsCard = ({ data, loading }) => {
    if (loading) {
        return (
            <Card sx={{ height: '100%' }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Performance de Resolvers
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
                        Performance de Resolvers
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                        <Typography color="textSecondary">No hay datos disponibles</Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    // Preparar datos para el gráfico circular
    const chartData = data.map((resolver) => ({
        name: resolver.nombre,
        value: resolver.ticketsResueltos,
        correo: resolver.correo,
    }));

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <Box
                    sx={{
                        bgcolor: 'background.paper',
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                    }}
                >
                    <Typography variant="body2" fontWeight="bold">
                        {payload[0].name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Tickets resueltos: {payload[0].value}
                    </Typography>
                </Box>
            );
        }
        return null;
    };

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Performance de Resolvers
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Distribución de tickets resueltos por agente
                </Typography>

                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>

                {/* Lista de resolvers */}
                <Box sx={{ mt: 2 }}>
                    {data.map((resolver, index) => (
                        <Box
                            key={resolver._id}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                py: 1,
                                borderBottom: index < data.length - 1 ? '1px solid' : 'none',
                                borderColor: 'divider',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box
                                    sx={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: '50%',
                                        bgcolor: COLORS[index % COLORS.length],
                                    }}
                                />
                                <Box>
                                    <Typography variant="body2" fontWeight={500}>
                                        {resolver.nombre}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {resolver.rol}
                                    </Typography>
                                </Box>
                            </Box>
                            <Typography variant="body2" fontWeight="bold">
                                {resolver.ticketsResueltos} tickets
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </CardContent>
        </Card>
    );
};

export default ResolverStatsCard;
