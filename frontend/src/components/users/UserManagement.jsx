import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { PERMISSIONS } from '../../constants/permissions';
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
    Grid,
    Typography,
    Divider,
    InputAdornment,
    ListSubheader,
    Autocomplete
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import api from '../../api/api';

/**
 * Componente de gestión de usuarios
 * @param {Object} props
 * @param {Object} props.currentUser - Usuario actual
 * @param {string} props.empresaId - ID de la empresa (opcional, para filtrar)
 */
const UserManagement = ({ currentUser, empresaId }) => {
    const { hasPermission } = useAuth();
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]); // Dynamic Roles
    const [companies, setCompanies] = useState([]); // List of companies
    const [filteredRoles, setFilteredRoles] = useState([]); // Roles filtered by selected company
    const [skills, setSkills] = useState([]); // Catalog of available skills
    const [loading, setLoading] = useState(false);

    // Dialog States
    const [openDialog, setOpenDialog] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [skillsDialogOpen, setSkillsDialogOpen] = useState(false);

    // Selected User States
    const [editingUser, setEditingUser] = useState(null);
    const [viewingUser, setViewingUser] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        nombre: '',
        correo: '',
        rol: '',
        contraseña: '',
        telefono: '',
        puesto: '',
        empresaId: empresaId || '',
    });

    // Password Visibility State (Map of userId -> boolean)
    const [showPasswordMap, setShowPasswordMap] = useState({});

    // Cargar usuarios y roles al montar
    // Cargar usuarios
    // Cargar usuarios
    const loadUsers = async () => {
        try {
            setLoading(true);
            const params = empresaId ? { empresaId } : {};

            // Construir promesas
            const promises = [api.get('/usuarios', { params })];

            // Si es admin sistema, intentar cargar admins también
            // Nota: Si se filtra por empresa, tal vez no queramos ver todos los admins, 
            // pero por simplicidad y para asegurar que se vea el que acabamos de crear:
            if (['admin-general', 'admin-subroot'].includes(currentUser?.rol)) {
                // Capturamos error individualmente para que no falle todo si /admins falla
                promises.push(api.get('/admins').catch(() => ({ data: [] })));
            }

            const results = await Promise.all(promises);

            // Usuarios
            const usersResponse = results[0];
            const usersData = usersResponse.data.usuarios || usersResponse.data || [];
            let allUsers = Array.isArray(usersData) ? usersData : [];

            // Admins (si existen en la respuesta)
            if (results.length > 1) {
                const adminsResponse = results[1];
                const adminsData = adminsResponse.data || [];
                if (Array.isArray(adminsData)) {
                    // Filtrar admins si hay empresaId? 
                    // Si estamos viendo una empresa específica, quizás solo queramos usuarios de esa empresa.
                    // Pero admin-subroot podría estar asignado a una empresa.
                    let adminsFiltered = adminsData;
                    if (empresaId) {
                        adminsFiltered = adminsData.filter(a => a.empresa?._id === empresaId || a.empresa === empresaId);
                    }

                    // REQUERIMIENTO: Si spy admin-subroot, NO veo a admin-general
                    if (currentUser?.rol === 'admin-subroot') {
                        adminsFiltered = adminsFiltered.filter(a => a.rol !== 'admin-general');
                    }

                    // Unir listas, evitando duplicados si hubiese cruzamiento (poco probable dada la arquitectura)
                    // Usamos un Map por _id? O simple concat. ID collision es muy improbable.
                    allUsers = [...adminsFiltered, ...allUsers];
                }
            }

            setUsers(allUsers);
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const loadRoles = async () => {
        try {
            const res = await api.get('/roles');
            setRoles(res.data);
        } catch (error) {
            console.error('Error loading roles:', error);
        }
    };

    const loadCompanies = async () => {
        try {
            // Fetch companies only if user has permission
            if (hasPermission(PERMISSIONS.COMPANY_MANAGE) || hasPermission(PERMISSIONS.COMPANY_VIEW)) {
                const res = await api.get('/empresas');
                setCompanies(res.data);
            }
        } catch (error) {
            console.error('Error loading companies:', error);
        }
    };

    const loadSkills = async () => {
        try {
            // Internals might need to see skills too? Yes, for their resolvers.
            // Endpoint handles permission filtering.
            const res = await api.get('/habilidades');
            setSkills(res.data);
        } catch (error) {
            console.error('Error loading skills:', error);
        }
    };

    // Filter roles when formData.empresaId changes
    useEffect(() => {
        if (!formData.empresaId) {
            // If no company selected, maybe show only global roles or nothing?
            // "me pida ... la empresa ... una vez selecione ... me muestre roles"
            // So show nothing or just standard systemless roles?
            // Let's show global roles (no company) + Standard
            setFilteredRoles(roles.filter(r => !r.empresa));
        } else {
            // Show Global Roles + Roles for specific Company
            setFilteredRoles(roles.filter(r => !r.empresa || r.empresa === formData.empresaId || r.empresa?._id === formData.empresaId));
        }
    }, [formData.empresaId, roles]);

    // Cargar usuarios y roles al montar
    useEffect(() => {
        if (currentUser) {
            loadUsers();
            loadRoles();
            loadCompanies();
            loadSkills();
        }
    }, [empresaId, currentUser]);


    // --- MANEJO DE DIÁLOGOS ---

    const [contextDialogOpen, setContextDialogOpen] = useState(false);

    // ...

    // Crear/Editar
    const handleOpenDialog = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                nombre: user.nombre,
                correo: user.correo,
                rol: user.rol,
                contraseña: '',
                telefono: user.telefono || '',
                puesto: user.puesto || '',
                empresaId: user.empresa?._id || user.empresa || empresaId || '',
                habilidades: user.habilidades || [],
            });
            setOpenDialog(true);
        } else {
            // New User Logic
            setEditingUser(null);

            // Check if user has permission to manage companies (select context)
            if (hasPermission(PERMISSIONS.COMPANY_MANAGE)) {
                setContextDialogOpen(true);
                return;
            }

            // Normal flow for internal admins (auto-assign company)
            let defaultEmpresaId = currentUser?.empresaId || currentUser?.empresa?._id || empresaId || '';
            setFormData({
                nombre: '',
                correo: '',
                rol: '',
                contraseña: '',
                telefono: '',
                puesto: '',
                empresaId: defaultEmpresaId,
                habilidades: [],
            });
            setOpenDialog(true);
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingUser(null);
        setFormData({
            nombre: '',
            correo: '',
            rol: '',
            contraseña: '',
            telefono: '',
            puesto: '',
            empresaId: empresaId || '',
            habilidades: [],
        });
    };

    // ... (Visualizar and Eliminar handlers unchanged) ...

    // Visualizar
    const handleViewUser = (user) => {
        setViewingUser(user);
        setViewDialogOpen(true);
    };

    const handleCloseViewDialog = () => {
        setViewDialogOpen(false);
        setViewingUser(null);
    };

    // Eliminar
    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setUserToDelete(null);
    };


    // --- ACCIONES ---

    // Toggle Mostrar Password (solo visual en la tabla)
    const togglePasswordVisibility = (userId) => {
        setShowPasswordMap(prev => ({
            ...prev,
            [userId]: !prev[userId]
        }));
    };

    // Guardar usuario
    const handleSaveUser = async () => {
        try {
            // Verificar campos requeridos
            if (!formData.nombre || !formData.correo || !formData.rol) {
                alert('Por favor complete los campos obligatorios (Nombre, Correo, Rol)');
                return;
            }

            if (editingUser) {
                // Actualizar
                // Validar si es Admin (admin-general/subroot) o Usuario
                const isAdmin = ['admin-general', 'admin-subroot'].includes(editingUser.rol);
                const endpoint = isAdmin ? `/admins/${editingUser._id}` : `/usuarios/${editingUser._id}`;

                // Mapear payload
                const payload = { ...formData, empresa: formData.empresaId };
                await api.put(endpoint, payload);
            } else {
                // Crear
                if (['admin-general', 'admin-subroot'].includes(formData.rol)) {
                    // Es un Administrador del Sistema
                    const payload = {
                        ...formData,
                        empresa: formData.empresaId // Mapear empresaId a empresa
                    };
                    await api.post('/admins', payload);
                } else {
                    // Es un Usuario (o Admin Interno)
                    const payload = {
                        ...formData, // Spread all including habilidades
                        email: formData.correo, // Backend compatibility
                        password: formData.contraseña, // Backend compatibility
                        empresa: formData.empresaId,
                    };
                    await api.post('/usuarios', payload);
                }
            }
            handleCloseDialog();
            loadUsers();
        } catch (error) {
            console.error('Error guardando usuario:', error);
            alert(error.response?.data?.msg || error.response?.data?.message || 'Error al guardar usuario');
        }
    };

    // Confirmar Eliminar
    const handleConfirmDelete = async () => {
        if (!userToDelete) return;
        try {
            // Determinar si borrar de /admins o /usuarios
            const isAdmin = ['admin-general', 'admin-subroot'].includes(userToDelete.rol);
            const endpoint = isAdmin ? `/admins/${userToDelete._id}` : `/usuarios/${userToDelete._id}`;

            await api.delete(endpoint);
            handleCloseDeleteDialog();
            loadUsers();
        } catch (error) {
            console.error('Error eliminando usuario:', error);
            alert(error.response?.data?.msg || 'Error al eliminar usuario');
        }
    };

    // Toggle Estado (Suspender/Activar)
    const handleToggleStatus = async (user) => {
        try {
            const nuevoEstado = !user.activo;
            const isAdmin = ['admin-general', 'admin-subroot'].includes(user.rol);
            const endpoint = isAdmin ? `/admins/${user._id}` : `/usuarios/${user._id}`;

            await api.put(endpoint, { activo: nuevoEstado });
            loadUsers();
        } catch (error) {
            console.error('Error cambiando estado:', error);
            alert('Error al cambiar estado del usuario');
        }
    };

    // Definir columnas
    const columns = [
        {
            field: 'avatar',
            headerName: '',
            width: 50,
            renderCell: (params) => (
                <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontSize: '0.9rem' }}>
                    {params.row.nombre?.[0]?.toUpperCase() || 'U'}
                </Avatar>
            ),
        },
        {
            field: 'nombre',
            headerName: 'Nombre',
            flex: 1.2,
            minWidth: 180,
        },
        {
            field: 'correo',
            headerName: 'Correo',
            flex: 1.2,
            minWidth: 200,
        },
        // Nueva columna Contraseña (visual)
        {
            field: 'password_placeholder',
            headerName: 'Contraseña',
            width: 140,
            renderCell: (params) => {
                const show = showPasswordMap[params.row._id];
                return (
                    <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', letterSpacing: 2 }}>
                            {show ? '********' : '••••••••'}
                        </Typography>
                        <IconButton size="small" onClick={() => togglePasswordVisibility(params.row._id)}>
                            {show ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                    </Box>
                );
            }
        },
        {
            field: 'rol',
            headerName: 'Rol',
            width: 140,
            renderCell: (params) => {
                const roleColors = {
                    'admin-general': 'error',
                    'admin-subroot': 'error',
                    'admin-interno': 'primary',
                    'soporte': 'info',
                    'beca-soporte': 'warning',
                    'usuario': 'default',
                };
                return (
                    <Chip
                        label={params.value}
                        color={roleColors[params.value] || 'default'}
                        size="small"
                        variant="outlined"
                    />
                );
            },
        },
        {
            field: 'empresa',
            headerName: 'Empresa',
            flex: 1,
            minWidth: 160,
            valueGetter: (value, row) => {
                const empresaObj = row?.empresa || value?.empresa || value;
                return empresaObj?.nombre || 'N/A';
            },
        },
        {
            field: 'activo',
            headerName: 'Estado',
            width: 120,
            renderCell: (params) => (
                <Tooltip title="Click para cambiar estado">
                    <Chip
                        label={params.value ? 'Activo' : 'Inactivo'}
                        color={params.value ? 'success' : 'default'}
                        size="small"
                        onClick={() => handleToggleStatus(params.row)}
                        sx={{ cursor: 'pointer' }}
                    />
                </Tooltip>
            ),
        },
        {
            field: 'actions',
            headerName: 'Acciones',
            width: 150,
            sortable: false,
            renderCell: (params) => (
                <Box>
                    <Tooltip title="Ver Detalles">
                        <IconButton
                            size="small"
                            onClick={() => handleViewUser(params.row)}
                            color="info"
                        >
                            <VisibilityIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                        <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(params.row)}
                            color="primary"
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                        <span>
                            <IconButton
                                size="small"
                                onClick={() => handleDeleteClick(params.row)}
                                color="error"
                                disabled={!hasPermission(PERMISSIONS.USERS_DELETE)}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </span>
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
                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                />
            </Paper>

            {/* Dialog Crear/Editar */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={1}>
                        {/* 1. SELECCIÓN DE EMPRESA (Solo si tiene permiso) */}
                        {hasPermission(PERMISSIONS.COMPANY_MANAGE) && !empresaId && (<TextField
                            select
                            label="Empresa (Requerido para filtrar roles)"
                            value={formData.empresaId}
                            onChange={(e) => {
                                setFormData({ ...formData, empresaId: e.target.value, rol: '' });
                            }}
                            fullWidth
                            required
                            disabled={editingUser && (editingUser.rol === 'admin-general' || editingUser.rol === 'admin-subroot')} // System users might be locked to HQ?
                        >
                            <MenuItem value="">
                                <em>Seleccione una empresa</em>
                            </MenuItem>
                            {companies.map((company) => (
                                <MenuItem key={company._id} value={company._id}>
                                    {company.nombre} {company.rfc === 'AURONTEK001' ? '(HQ)' : ''}
                                </MenuItem>
                            ))}
                        </TextField>
                        )}

                        {/* 2. DATOS BÁSICOS */}
                        <TextField
                            label="Nombre Completo"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Correo Electrónico"
                            type="email"
                            value={formData.correo}
                            onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                            fullWidth
                            required
                        />

                        {/* 3. SELECCIÓN DE ROL (Dinámico) */}
                        <TextField
                            select
                            label="Rol Asignado"
                            value={formData.rol}
                            onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                            fullWidth
                            required
                            disabled={!formData.empresaId && hasPermission(PERMISSIONS.COMPANY_MANAGE)}
                            helperText={(!formData.empresaId && hasPermission(PERMISSIONS.COMPANY_MANAGE)) ? "Seleccione una empresa primero" : ""}
                        >
                            {/* Determine if selected company is HQ */}
                            {(() => {
                                const selectedComp = companies.find(c => c._id === formData.empresaId);
                                const isHQ = selectedComp?.rfc === 'AURONTEK001'; // If no company selected by Admin, default to false or hide?
                                // In new flow, context sets ID. If editing, ID exists.
                                // If "Admin General" hasn't selected yet, show nothing?
                                if (!formData.empresaId && ['admin-general', 'admin-subroot', 'soporte-plataforma'].includes(currentUser?.rol)) return null;

                                return (
                                    <>
                                        {/* Roles de Empresa (Cliente) - ONLY if NOT HQ */}
                                        {!isHQ && (
                                            <>
                                                <ListSubheader>Roles de Empresa (Cliente)</ListSubheader>
                                                <MenuItem value="admin-interno">Administrador de Empresa (Cliente)</MenuItem>
                                                <MenuItem value="resolutor-empresa">Resolutor Interno (Cliente)</MenuItem>
                                                <MenuItem value="soporte">Soporte N1 (Legacy)</MenuItem>
                                                <MenuItem value="usuario">Usuario Estándar</MenuItem>
                                                <MenuItem value="cliente-final">Cliente Externo</MenuItem>
                                                <MenuItem value="becario">Becario / Trainee</MenuItem>
                                            </>
                                        )}

                                        {/* Roles Personalizados - Filtered by backend logic roughly, but ensured here */}
                                        {filteredRoles.length > 0 && (
                                            <>
                                                <Divider />
                                                <ListSubheader>Roles Personalizados</ListSubheader>
                                                {filteredRoles.map(r => (
                                                    <MenuItem key={r._id} value={r.slug || r.nombre}>{r.nombre}</MenuItem>
                                                ))}
                                            </>
                                        )}

                                        {/* Roles de Sistema (Aurontek HQ) - ONLY if HQ */}
                                        {isHQ && (
                                            <>
                                                <Divider />
                                                <ListSubheader>Roles de Sistema (Aurontek HQ)</ListSubheader>
                                                <MenuItem value="resolutor-interno">Resolutor de Plataforma (HQ)</MenuItem>
                                                <MenuItem value="soporte-plataforma">Soporte Plataforma (HQ)</MenuItem>
                                                <MenuItem value="usuario">Usuario Estándar (Interno)</MenuItem>

                                                {currentUser?.rol === 'admin-general' && (
                                                    <MenuItem value="admin-general">Admin General (Super Admin)</MenuItem>
                                                )}
                                                {currentUser?.rol === 'admin-general' && (
                                                    <MenuItem value="admin-subroot">Admin Subroot (Gestor)</MenuItem>
                                                )}
                                            </>
                                        )}
                                    </>
                                );
                            })()}
                        </TextField>

                        {/* 4. HABILIDADES (Solo para Resolutores) */}
                        {['resolutor-interno', 'soporte-plataforma', 'resolutor-empresa', 'soporte', 'becario', 'beca-soporte'].includes(formData.rol) && (
                            <Box display="flex" gap={1} alignItems="flex-start">
                                <Autocomplete
                                    multiple
                                    options={skills.map((s) => s.nombre)}
                                    value={formData.habilidades || []}
                                    onChange={(event, newValue) => {
                                        setFormData({ ...formData, habilidades: newValue });
                                    }}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                                        ))
                                    }
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Habilidades / Skills (Catálogo)"
                                            placeholder="Seleccionar..."
                                            helperText={
                                                hasPermission(PERMISSIONS.HABILITIES_MANAGE)
                                                    ? "Seleccione del catálogo o use el lápiz para gestionar."
                                                    : "Seleccione las habilidades del catálogo."
                                            }
                                        />
                                    )}
                                    sx={{ flex: 1 }}
                                />
                                {hasPermission(PERMISSIONS.HABILITIES_MANAGE) && (
                                    <Tooltip title="Gestionar Catálogo de Habilidades">
                                        <IconButton
                                            onClick={() => setSkillsDialogOpen(true)}
                                            sx={{ mt: 1 }}
                                            color="primary"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Box>
                        )}

                        <Box display="flex" gap={2}>
                            <TextField
                                label="Teléfono"
                                value={formData.telefono}
                                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                fullWidth
                            />
                            <TextField
                                label="Puesto / Cargo"
                                value={formData.puesto}
                                onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                                fullWidth
                            />
                        </Box>

                        <TextField
                            label="Contraseña"
                            type="password"
                            value={formData.contraseña}
                            onChange={(e) => setFormData({ ...formData, contraseña: e.target.value })}
                            fullWidth
                            required={!editingUser}
                            helperText={editingUser ? 'Dejar en blanco para conservar la actual' : 'Requerida para nuevos usuarios'}
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

            {/* Dialog Ver Detalles */}
            <Dialog open={viewDialogOpen} onClose={handleCloseViewDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {viewingUser?.nombre?.[0]?.toUpperCase()}
                        </Avatar>
                        <Typography variant="h6">Detalles del Usuario</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    {viewingUser && (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="text.secondary">Nombre</Typography>
                                <Typography variant="body1">{viewingUser.nombre}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="text.secondary">Correo</Typography>
                                <Typography variant="body1">{viewingUser.correo}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">Rol</Typography>
                                <Chip label={viewingUser.rol} size="small" color="primary" variant="outlined" />
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">Estado</Typography>
                                <Chip
                                    label={viewingUser.activo ? 'Activo' : 'Inactivo'}
                                    size="small"
                                    color={viewingUser.activo ? 'success' : 'default'}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">Teléfono</Typography>
                                <Typography variant="body1">{viewingUser.telefono || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">Puesto</Typography>
                                <Typography variant="body1">{viewingUser.puesto || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="text.secondary">Empresa</Typography>
                                <Typography variant="body1">{viewingUser.empresa?.nombre || 'N/A'}</Typography>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseViewDialog}>Cerrar</Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            handleCloseViewDialog();
                            handleOpenDialog(viewingUser);
                        }}
                    >
                        Editar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog Eliminar Bonito */}
            <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
                    <WarningAmberIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6" component="div">¿Eliminar Usuario?</Typography>
                </DialogTitle>
                <DialogContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Estás a punto de eliminar a <strong>{userToDelete?.nombre}</strong>.
                    </Typography>
                    <Typography variant="body2" color="error">
                        Esta acción no se puede deshacer.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
                    <Button onClick={handleCloseDeleteDialog} variant="outlined">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon />}
                    >
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Dialog Gestionar Habilidades */}
            <Dialog open={skillsDialogOpen} onClose={() => setSkillsDialogOpen(false)} maxWidth="sm" fullWidth>
                {/* ... (existing skills dialog content) ... */}
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">Gestionar Catálogo de Habilidades</Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                                const name = prompt("Nombre de la nueva habilidad:");
                                if (name) {
                                    api.post('/habilidades', { nombre: name })
                                        .then(() => {
                                            loadSkills();
                                        })
                                        .catch(err => alert("Error creando habilidad: " + err.response?.data?.msg));
                                }
                            }}
                            startIcon={<AddIcon />}
                        >
                            Nueva
                        </Button>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                        {skills.map((skill) => (
                            <Chip
                                key={skill._id}
                                label={skill.nombre}
                                onDelete={() => {
                                    if (window.confirm(`¿Eliminar habilidad "${skill.nombre}"?`)) {
                                        api.delete(`/habilidades/${skill._id}`)
                                            .then(() => loadSkills())
                                            .catch(err => alert("Error eliminando: " + err.response?.data?.msg));
                                    }
                                }}
                                color="primary"
                                variant="outlined"
                            />
                        ))}
                    </Box>
                    {skills.length === 0 && (
                        <Typography variant="body2" color="text.secondary" align="center" py={2}>
                            No hay habilidades registradas. Agregue una nueva.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSkillsDialogOpen(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog Selección de Contexto (Pre-Registro) */}
            <Dialog open={contextDialogOpen} onClose={() => setContextDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle align="center">¿Dónde deseas registrar el usuario?</DialogTitle>
                <DialogContent>
                    {!formData.contextMode ? (
                        <Box display="flex" flexDirection="column" gap={2} my={2}>
                            <Button
                                variant="contained"
                                color="primary"
                                size="large"
                                onClick={() => {
                                    // Find Aurontek HQ
                                    const hq = companies.find(c => c.rfc === 'AURONTEK001');
                                    if (hq) {
                                        setFormData({
                                            ...formData,
                                            empresaId: hq._id,
                                            rol: '', // Reset role to force re-selection
                                            habilidades: []
                                        });
                                        setContextDialogOpen(false);
                                        setOpenDialog(true);
                                    } else {
                                        alert("Error: No se encontró la empresa Aurontek HQ en el sistema.");
                                    }
                                }}
                            >
                                Usuario Aurontek HQ (Interno)
                            </Button>
                            <Button
                                variant="outlined"
                                color="primary"
                                size="large"
                                onClick={() => setFormData({ ...formData, contextMode: 'select_company' })}
                            >
                                Usuario en Empresa Cliente
                            </Button>
                        </Box>
                    ) : (
                        <Box display="flex" flexDirection="column" gap={2} my={2}>
                            <Typography variant="body2">Seleccione la empresa cliente:</Typography>
                            <TextField
                                select
                                label="Empresa Cliente"
                                value={formData.empresaId}
                                onChange={(e) => setFormData({ ...formData, empresaId: e.target.value })}
                                fullWidth
                            >
                                {companies.filter(c => c.rfc !== 'AURONTEK001').map((company) => (
                                    <MenuItem key={company._id} value={company._id}>
                                        {company.nombre}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <Button
                                variant="contained"
                                disabled={!formData.empresaId}
                                onClick={() => {
                                    setFormData({ ...formData, rol: '', habilidades: [], contextMode: undefined }); // Clear temp flag
                                    setContextDialogOpen(false);
                                    setOpenDialog(true);
                                }}
                            >
                                Continuar al Formulario
                            </Button>
                            <Button size="small" onClick={() => setFormData({ ...formData, contextMode: undefined })}>
                                Volver
                            </Button>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default UserManagement;
