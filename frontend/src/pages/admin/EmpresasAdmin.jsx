import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Container, Alert } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import EmpresasTable from '../../components/admin/EmpresasTable';
import { getTodasEmpresas } from '../../services/empresaService';

const EmpresasAdmin = () => {
    const navigate = useNavigate();
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadEmpresas = async () => {
        setLoading(true);
        try {
            const data = await getTodasEmpresas();
            setEmpresas(data);
        } catch (err) {
            setError('Error al cargar empresas.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEmpresas();
    }, []);

    return (
        <Container maxWidth="xl">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
                <Typography variant="h4" fontWeight="bold">Gestión de Empresas</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/admin/empresas/nueva')}
                >
                    Nueva Empresa
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <EmpresasTable
                empresas={empresas}
                loading={loading}
                onUpdate={loadEmpresas}
            />
        </Container>
    );
};

export default EmpresasAdmin;
