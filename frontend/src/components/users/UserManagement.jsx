import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem,
    IconButton,
    Chip,
    Avatar,
    Tooltip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonIcon from '@mui/icons-material/Person';
import api from '../../api/api';

/**
 * Componente de gestión de usuarios
 * @param {Object} props
 * @param {Object} props.currentUser - Usuario actual
 * @param {string} props.empresaId - ID de la empresa (opcional, para filtrar)
 */
const UserManagement = ({ currentUser, empresaId }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        correo: '',
        rol: '',
        contraseña: '',
        empresaId: empresaId || '',
    });

    // Cargar usuarios
    const loadUsers = async () => {
        try {
            setLoading(true);
            const params = empresaId ? { empresaId } : {};
            const response = await api.get('/usuarios', { params });
            setUsers(response.data.usuarios || response.data || []);
        } catch (error) {
            console.error('Error cargando usuarios:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [empresaId]);

    // Abrir dialog para crear/editar
    const handleOpenDialog = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                nombre: user.nombre,
                correo: user.correo,
                rol: user.rol,
                contraseña: '',
                empresaId: user.empresaId || empresaId || '',
            });
        } else {
            setEditingUser(null);
            setFormData({
                nombre: '',
                correo: '',
                rol: '',
                contraseña: '',
                empresaId: empresaId || '',
            });
        }
        setOpenDialog(true);
    };

    // Cerrar dialog
    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingUser(null);
        setFormData({
            nombre: '',
            correo: '',
            rol: '',
            contraseña: '',
            empresaId: empresaId || '',
        });
    };

    // Guardar usuario
    const handleSaveUser = async () => {
        try {
            if (editingUser) {
                // Actualizar
                await api.put(`/usuarios/${editingUser._id}`, formData);
            } else {
                // Crear
                await api.post('/auth/register', formData);
            }

            handleCloseDialog();
            loadUsers();
        } catch (error) {
            console.error('Error guardando usuario:', error);
            alert(error.response?.data?.message || 'Error al guardar usuario');
        }
    };

    // Eliminar usuario
    const handleDeleteUser = async (userId) => {
        if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;

        try {
            await api.delete(`/usuarios/${userId}`);
            loadUsers();
        } catch (error) {
            console.error('Error eliminando usuario:', error);
            alert(error.response?.data?.message || 'Error al eliminar usuario');
        }
    };

    // Definir columnas
    const columns = [
        {
            field: 'avatar',
            headerName: '',
            width: 60,
            renderCell: (params) => (
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                    {params.row.nombre?.[0]?.toUpperCase() || 'U'}
                </Avatar>
            ),
        },
        {
            field: 'nombre',
            headerName: 'Nombre',
            flex: 1,
            minWidth: 150,
        },
        {
            field: 'correo',
            headerName: 'Correo',
            flex: 1,
            minWidth: 200,
        },
        {
            field: 'rol',
            headerName: 'Rol',
            width: 150,
            renderCell: (params) => {
                const roleColors = {
                    'Admin': 'error',
                    'admin-interno': 'primary',
                    'admin_empresa': 'secondary',
                    'soporte': 'info',
                    'beca-soporte': 'warning',
                    'usuario': 'default',
                };
                return (
                    <Chip
                        label={params.value}
                        color={roleColors[params.value] || 'default'}
                        size="small"
                    />
                );
            },
        },
        {
            field: 'empresa',
            headerName: 'Empresa',
            width: 150,
            valueGetter: (params) => params.row.empresa?.nombre || 'N/A',
        },
        {
            field: 'activo',
            headerName: 'Estado',
            width: 100,
            renderCell: (params) => (
                <Chip
                    label={params.value ? 'Activo' : 'Inactivo'}
                    color={params.value ? 'success' : 'default'}
                    size="small"
                />
            ),
        },
        {
            field: 'actions',
            headerName: 'Acciones',
            width: 120,
            sortable: false,
            renderCell: (params) => (
                <Box>
                    <Tooltip title="Editar">
                        <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(params.row)}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                        <IconButton
                            size="small"
                            onClick={() => handleDeleteUser(params.row._id)}
                            color="error"
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    return (
        <Box>
            <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Chip
                        icon={<PersonIcon />}
                        label={`${users.length} usuarios`}
                        color="primary"
                    />
                    <Box display="flex" gap={1}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={loadUsers}
                        >
                            Refrescar
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog()}
                        >
                            Nuevo Usuario
                        </Button>
                    </Box>
                </Box>
            </Paper>

            <Paper elevation={2} sx={{ height: 600 }}>
                <DataGrid
                    rows={users}
                    columns={columns}
                    loading={loading}
                    getRowId={(row) => row._id}
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 25 } },
                    }}
                    disableRowSelectionOnClick
                />
            </Paper>

            {/* Dialog para crear/editar */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={1}>
                        <TextField
                            label="Nombre"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Correo"
                            type="email"
                            value={formData.correo}
                            onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                            fullWidth
                            required
                        />
                        <TextField
                            select
                            label="Rol"
                            value={formData.rol}
                            onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                            fullWidth
                            required
                        >
                            <MenuItem value="admin-interno">Admin Interno</MenuItem>
                            <MenuItem value="admin_empresa">Admin Empresa</MenuItem>
                            <MenuItem value="soporte">Soporte</MenuItem>
                            <MenuItem value="beca-soporte">Becario Soporte</MenuItem>
                            <MenuItem value="usuario">Usuario</MenuItem>
                        </TextField>
                        <TextField
                            label="Contraseña"
                            type="password"
                            value={formData.contraseña}
                            onChange={(e) => setFormData({ ...formData, contraseña: e.target.value })}
                            fullWidth
                            required={!editingUser}
                            helperText={editingUser ? 'Dejar en blanco para no cambiar' : ''}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button
                        onClick={handleSaveUser}
                        variant="contained"
                        disabled={!formData.nombre || !formData.correo || !formData.rol}
                    >
                        {editingUser ? 'Actualizar' : 'Crear'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserManagement;
