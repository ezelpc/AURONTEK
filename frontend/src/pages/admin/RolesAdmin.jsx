import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Typography, Chip, Tooltip,
    FormControl, FormGroup, FormControlLabel, Checkbox,
    Divider, Grid, IconButton, Alert
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../../api/api';

const RolesAdmin = ({ user }) => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [permisos, setPermisos] = useState([]); // Master list of permission groups

    // Dialog State
    const [openDialog, setOpenDialog] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        description: '',
        permissions: [] // Array of permission strings
    });

    const [error, setError] = useState(null);

    // Initial Load
    useEffect(() => {
        loadRoles();
        loadPermissions();
    }, []);

    const loadRoles = async () => {
        setLoading(true);
        try {
            const res = await api.get('/roles');
            setRoles(res.data);
        } catch (err) {
            console.error('Error loading roles:', err);
            setError('Error cargando roles');
        } finally {
            setLoading(false);
        }
    };

    const loadPermissions = async () => {
        try {
            const res = await api.get('/roles/permissions');
            setPermisos(res.data);
        } catch (err) {
            console.error('Error loading permissions:', err);
        }
    };

    const handleOpenDialog = (role = null) => {
        if (role) {
            setEditingRole(role);
            setFormData({
                nombre: role.nombre,
                description: role.descripcion || '',
                permissions: role.permisos || []
            });
        } else {
            setEditingRole(null);
            setFormData({
                nombre: '',
                description: '',
                permissions: []
            });
        }
        setOpenDialog(true);
    };

    const handleTogglePermission = (permKey) => {
        setFormData(prev => {
            const exists = prev.permissions.includes(permKey);
            let newPerms;
            if (exists) {
                newPerms = prev.permissions.filter(p => p !== permKey);
            } else {
                newPerms = [...prev.permissions, permKey];
            }
            return { ...prev, permissions: newPerms };
        });
    };

    const handleSave = async () => {
        try {
            if (!formData.nombre.trim()) {
                alert('El nombre es requerido');
                return;
            }

            const payload = {
                nombre: formData.nombre,
                description: formData.description,
                permisos: formData.permissions,
                // Empresa logic handled by backend mainly based on user who creates
                // For Admin Global creating for another company, we might need a Company Selector in the future.
                // Current user request implies standard creation for now.
            };

            if (editingRole) {
                await api.put(`/roles/${editingRole._id}`, payload);
            } else {
                await api.post('/roles', payload);
            }

            setOpenDialog(false);
            loadRoles();
        } catch (err) {
            console.error('Error saving role:', err);
            alert(err.response?.data?.msg || 'Error al guardar rol');
        }
    };

    const handleDelete = async (roleId) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este rol?')) {
            try {
                await api.delete(`/roles/${roleId}`);
                loadRoles();
            } catch (err) {
                console.error('Error deleting role:', err);
                alert('Error al eliminar el rol');
            }
        }
    };

    const columns = [
        { field: 'nombre', headerName: 'Rol', flex: 1, minWidth: 150 },
        { field: 'descripcion', headerName: 'Descripción', flex: 1.5, minWidth: 200 },
        {
            field: 'empresa',
            headerName: 'Alcance',
            width: 150,
            renderCell: (params) => {
                const empresa = params.row.empresa;
                let label = 'Global';
                let color = 'success'; // Green for truly global (no company)

                if (empresa) {
                    if (empresa.rfc === 'AURONTEK001' || empresa.nombre?.includes('Aurontek HQ')) {
                        label = 'Aurontek HQ';
                        color = 'secondary'; // Purple/Pink for HQ
                    } else {
                        label = empresa.nombre || 'Empresa';
                        color = 'primary'; // Blue for Clients
                    }
                } else {
                    // If null, it is technically Global.
                    // User calls this "Global Aurontek HQ" sometimes?
                    // Let's stick to "Global" vs "Aurontek HQ" vs "Company Name"
                    label = 'Global (System)';
                }

                return (
                    <Chip
                        label={label}
                        color={color}
                        size="small"
                        variant="outlined"
                    />
                );
            }
        },
        {
            field: 'actions',
            headerName: 'Acciones',
            width: 150,
            renderCell: (params) => (
                <Box>
                    <Tooltip title="Editar Rol">
                        <IconButton size="small" onClick={() => handleOpenDialog(params.row)}>
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar Rol">
                        <IconButton size="small" onClick={() => handleDelete(params.row._id)} color="error">
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ];

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5">Gestión de Roles y Permisos</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Nuevo Rol
                </Button>
            </Box>

            <Paper elevation={2} sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={roles}
                    columns={columns}
                    loading={loading}
                    getRowId={(row) => row._id}
                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                    disableRowSelectionOnClick
                />
            </Paper>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>{editingRole ? 'Editar Rol' : 'Crear Nuevo Rol'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Nombre del Rol"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Descripción"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Permisos</Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Grid container spacing={2}>
                                {permisos.map((group) => (
                                    <Grid item xs={12} md={6} key={group.module}>
                                        <Paper variant="outlined" sx={{ p: 2 }}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {group.module}
                                            </Typography>
                                            <FormGroup>
                                                {group.permissions.map((perm) => (
                                                    <FormControlLabel
                                                        key={perm.key}
                                                        control={
                                                            <Checkbox
                                                                checked={formData.permissions.includes(perm.key)}
                                                                onChange={() => handleTogglePermission(perm.key)}
                                                                size="small"
                                                            />
                                                        }
                                                        label={<Typography variant="body2">{perm.label}</Typography>}
                                                    />
                                                ))}
                                            </FormGroup>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSave}>Guardar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default RolesAdmin;
