import React, { useState, useEffect } from 'react';
import { getServices, createService, updateService, deleteService, bulkUploadServices, downloadTemplate } from '../api/servicios';
import useAuth from '../hooks/useAuth';
import { 
    Accordion, AccordionSummary, AccordionDetails, Typography, List, ListItem, ListItemIcon, ListItemText, 
    CircularProgress, Alert, Grid, Button, Box, IconButton, Dialog, DialogTitle, DialogContent, 
    DialogActions, TextField, MenuItem 
} from '@mui/material';
import { 
    ExpandMore as ExpandMoreIcon, Build as BuildIcon, Error as ErrorIcon, Category as CategoryIcon, 
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, UploadFile as UploadFileIcon, Download as DownloadIcon 
} from '@mui/icons-material';

const ServiceForm = ({ open, onClose, onSave, service }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (service) {
            setFormData(service);
        } else {
            setFormData({
                nombre: '',
                tipo: 'Requerimiento',
                categoria: '',
                sla: '',
                prioridad: 'Media'
            });
        }
    }, [service]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{service ? 'Editar Servicio' : 'Añadir Nuevo Servicio'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ pt: 1 }}>
                    <Grid item xs={12}>
                        <TextField name="nombre" label="Nombre del Servicio" value={formData.nombre || ''} onChange={handleChange} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField name="tipo" label="Tipo" value={formData.tipo || ''} onChange={handleChange} select fullWidth>
                            <MenuItem value="Requerimiento">Requerimiento</MenuItem>
                            <MenuItem value="Incidente">Incidente</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField name="categoria" label="Categoría" value={formData.categoria || ''} onChange={handleChange} fullWidth required />
                    </Grid>
                     <Grid item xs={12} sm={6}>
                        <TextField name="sla" label="SLA (ej. 4 horas)" value={formData.sla || ''} onChange={handleChange} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField name="prioridad" label="Prioridad" value={formData.prioridad || ''} onChange={handleChange} select fullWidth>
                            <MenuItem value="Baja">Baja</MenuItem>
                            <MenuItem value="Media">Media</MenuItem>
                            <MenuItem value="Alta">Alta</MenuItem>
                            <MenuItem value="Crítica">Crítica</MenuItem>
                        </TextField>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit} variant="contained">{service ? 'Guardar Cambios' : 'Crear'}</Button>
            </DialogActions>
        </Dialog>
    );
};


const Servicios = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    
    const { isAdmin } = useAuth();

    const fetchServices = async () => {
        try {
            setLoading(true);
            const data = await getServices();
            setServices(data);
        } catch (err) {
            setError('Error al cargar los servicios. Por favor, inténtelo de nuevo más tarde.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleOpenModal = (service = null) => {
        setSelectedService(service);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setSelectedService(null);
    };

    const handleSaveService = async (serviceData) => {
        try {
            if (serviceData._id) {
                await updateService(serviceData._id, serviceData);
            } else {
                await createService(serviceData);
            }
            fetchServices(); // Recargar
        } catch (err) {
            setError('Error al guardar el servicio.');
        } finally {
            handleCloseModal();
        }
    };

    const handleDeleteService = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
            try {
                await deleteService(id);
                fetchServices(); // Recargar
            } catch (err) {
                setError('Error al eliminar el servicio.');
            }
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                await bulkUploadServices(file);
                fetchServices();
            } catch (err) {
                setError('Error al subir el archivo.');
            }
        }
    };

    const groupedServices = services.reduce((acc, service) => {
        const { tipo, categoria } = service;
        if (!acc[tipo]) acc[tipo] = {};
        if (!acc[tipo][categoria]) acc[tipo][categoria] = [];
        acc[tipo][categoria].push(service);
        return acc;
    }, {});

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Grid container spacing={2} sx={{ p: 3 }}>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" gutterBottom>Catálogo de Servicios</Typography>
                {isAdmin() && (
                    <Box>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
                            Añadir Servicio
                        </Button>
                        <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} sx={{ mx: 1 }}>
                            Cargar Excel
                            <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileUpload} />
                        </Button>
                        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={downloadTemplate}>
                            Descargar Plantilla
                        </Button>
                    </Box>
                )}
            </Grid>
            <Grid item xs={12}>
                {Object.keys(groupedServices).length > 0 ? (
                    Object.entries(groupedServices).map(([tipo, categorias]) => (
                        <Accordion key={tipo} defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                {tipo === 'Requerimiento' ? <BuildIcon sx={{ mr: 1 }} /> : <ErrorIcon sx={{ mr: 1 }} />}
                                <Typography variant="h6">{tipo}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                {Object.entries(categorias).map(([categoria, serviceList]) => (
                                    <Accordion key={categoria} sx={{ mb: 1 }}>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <CategoryIcon sx={{ mr: 1 }} />
                                            <Typography>{categoria}</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <List>
                                                {serviceList.map((service) => (
                                                    <ListItem 
                                                        key={service._id}
                                                        secondaryAction={isAdmin() && (
                                                            <>
                                                                <IconButton edge="end" aria-label="edit" onClick={() => handleOpenModal(service)}>
                                                                    <EditIcon />
                                                                </IconButton>
                                                                <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteService(service._id)} sx={{ ml: 1 }}>
                                                                    <DeleteIcon />
                                                                </IconButton>
                                                            </>
                                                        )}
                                                    >
                                                        <ListItemText 
                                                            primary={service.nombre}
                                                            secondary={`SLA: ${service.sla || 'N/A'} | Prioridad: ${service.prioridad || 'N/A'}`}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
                            </AccordionDetails>
                        </Accordion>
                    ))
                ) : (
                    <Typography>No hay servicios en el catálogo.</Typography>
                )}
            </Grid>
            {openModal && <ServiceForm open={openModal} onClose={handleCloseModal} onSave={handleSaveService} service={selectedService} />}
        </Grid>
    );
};

export default Servicios;
