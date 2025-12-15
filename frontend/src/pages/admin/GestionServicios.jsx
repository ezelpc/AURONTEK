import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, Alert, Chip, Stack, Tooltip, CircularProgress, Grid
} from '@mui/material';
import {
    Add, Edit, Delete, CloudUpload, CloudDownload, Refresh
} from '@mui/icons-material';
import api from '../../api/api';
import { getCategoryIcon } from '../../constants/serviceCatalogIcons';

const GestionServicios = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        tipo: 'Incidente',
        categoria: '',
        dependencias: '',
        cicloDeVida: 'Activos',
        impacto: '',
        urgencia: '',
        prioridad: 'Media',
        sla: '',
        cliente: '',
        gruposDeAtencion: ''
    });

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        try {
            setLoading(true);
            const response = await api.get('/services');
            setServices(response.data);
        } catch (error) {
            console.error('Error loading services:', error);
            showMessage('error', 'Error al cargar servicios');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (tipo, texto) => {
        setMensaje({ tipo, texto });
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
    };

    const handleOpenDialog = (service = null) => {
        if (service) {
            setEditingService(service);
            setFormData(service);
        } else {
            setEditingService(null);
            setFormData({
                nombre: '',
                tipo: 'Incidente',
                categoria: '',
                dependencias: '',
                cicloDeVida: 'Activos',
                impacto: '',
                urgencia: '',
                prioridad: 'Media',
                sla: '',
                cliente: '',
                gruposDeAtencion: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingService(null);
    };

    const handleSubmit = async () => {
        try {
            if (editingService) {
                await api.put(`/services/${editingService._id}`, formData);
                showMessage('success', 'Servicio actualizado exitosamente');
            } else {
                await api.post('/services', formData);
                showMessage('success', 'Servicio creado exitosamente');
            }
            handleCloseDialog();
            loadServices();
        } catch (error) {
            console.error('Error saving service:', error);
            showMessage('error', error.response?.data?.message || 'Error al guardar servicio');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Está seguro de eliminar este servicio?')) return;

        try {
            await api.delete(`/services/${id}`);
            showMessage('success', 'Servicio eliminado exitosamente');
            loadServices();
        } catch (error) {
            console.error('Error deleting service:', error);
            showMessage('error', 'Error al eliminar servicio');
        }
    };

    const handleBulkUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const text = await file.text();
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

            const servicios = [];
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;

                const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                const servicio = {};
                headers.forEach((header, index) => {
                    servicio[header] = values[index] || '';
                });
                servicios.push(servicio);
            }

            await api.post('/services/bulk-upload', servicios);
            showMessage('success', `${servicios.length} servicios cargados exitosamente`);
            loadServices();
        } catch (error) {
            console.error('Error uploading file:', error);
            showMessage('error', 'Error al cargar archivo. Verifique el formato.');
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await api.get('/services/template', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'plantilla_servicios.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading template:', error);
            showMessage('error', 'Error al descargar plantilla');
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Paper sx={{ p: 3, mb: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h5" fontWeight="bold">Gestión de Catálogo de Servicios</Typography>
                    <Stack direction="row" spacing={1}>
                        <Tooltip title="Recargar">
                            <IconButton onClick={loadServices} color="primary">
                                <Refresh />
                            </IconButton>
                        </Tooltip>
                        <Button
                            variant="outlined"
                            startIcon={<CloudDownload />}
                            onClick={handleDownloadTemplate}
                        >
                            Descargar Plantilla
                        </Button>
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
                            disabled={uploading}
                        >
                            {uploading ? 'Cargando...' : 'Carga Masiva'}
                            <input
                                type="file"
                                hidden
                                accept=".csv"
                                onChange={handleBulkUpload}
                            />
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => handleOpenDialog()}
                        >
                            Nuevo Servicio
                        </Button>
                    </Stack>
                </Stack>

                {mensaje.texto && (
                    <Alert severity={mensaje.tipo} sx={{ mb: 2 }} onClose={() => setMensaje({ tipo: '', texto: '' })}>
                        {mensaje.texto}
                    </Alert>
                )}

                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total de servicios: {services.length}
                </Typography>
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Categoría</TableCell>
                            <TableCell>Prioridad</TableCell>
                            <TableCell>SLA</TableCell>
                            <TableCell>Grupo Atención</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {services.map((service) => {
                            const iconConfig = getCategoryIcon(service.categoria);
                            const IconComponent = iconConfig.icon;

                            return (
                                <TableRow key={service._id} hover>
                                    <TableCell>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <IconComponent sx={{ color: iconConfig.color, fontSize: 20 }} />
                                            <Typography variant="body2">{service.nombre}</Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={service.tipo}
                                            size="small"
                                            color={service.tipo === 'Incidente' ? 'error' : 'primary'}
                                        />
                                    </TableCell>
                                    <TableCell>{service.categoria}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={service.prioridad}
                                            size="small"
                                            color={
                                                service.prioridad === 'Alta' || service.prioridad === 'critica' ? 'error' :
                                                    service.prioridad === 'Media' ? 'warning' : 'default'
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>{service.sla}</TableCell>
                                    <TableCell>{service.gruposDeAtencion}</TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => handleOpenDialog(service)} color="primary">
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleDelete(service._id)} color="error">
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Dialog for Create/Edit */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Nombre del Servicio"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                select
                                fullWidth
                                label="Tipo"
                                value={formData.tipo}
                                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                            >
                                <MenuItem value="Incidente">Incidente</MenuItem>
                                <MenuItem value="Requerimiento">Requerimiento</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Categoría"
                                value={formData.categoria}
                                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                select
                                fullWidth
                                label="Prioridad"
                                value={formData.prioridad}
                                onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                            >
                                <MenuItem value="Baja">Baja</MenuItem>
                                <MenuItem value="Media">Media</MenuItem>
                                <MenuItem value="Alta">Alta</MenuItem>
                                <MenuItem value="critica">Crítica</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="SLA"
                                value={formData.sla}
                                onChange={(e) => setFormData({ ...formData, sla: e.target.value })}
                                placeholder="Ej: 4 horas"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Impacto"
                                value={formData.impacto}
                                onChange={(e) => setFormData({ ...formData, impacto: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Urgencia"
                                value={formData.urgencia}
                                onChange={(e) => setFormData({ ...formData, urgencia: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Dependencias"
                                value={formData.dependencias}
                                onChange={(e) => setFormData({ ...formData, dependencias: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Cliente"
                                value={formData.cliente}
                                onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Grupos de Atención"
                                value={formData.gruposDeAtencion}
                                onChange={(e) => setFormData({ ...formData, gruposDeAtencion: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={!formData.nombre || !formData.categoria}>
                        {editingService ? 'Actualizar' : 'Crear'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default GestionServicios;
