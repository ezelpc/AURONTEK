import React, { useState } from 'react';
import {
    Box, Paper,
    Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography,
    Chip, IconButton, Tooltip, Grid, MenuItem, Divider, Avatar
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Block as BlockIcon,
    CheckCircle as CheckCircleIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { actualizarEmpresa, eliminarEmpresa, toggleLicenciaEmpresa, regenerarCodigoAcceso } from '../../services/empresaService';

const EmpresasTable = ({ empresas, loading, onUpdate }) => {
    const [openView, setOpenView] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [openHQCode, setOpenHQCode] = useState(false);
    const [openRegenerateConfirm, setOpenRegenerateConfirm] = useState(false);
    const [hqCodeInput, setHqCodeInput] = useState('');
    const [pendingAction, setPendingAction] = useState(null);
    const [currentEmpresa, setCurrentEmpresa] = useState(null);
    const [showAccessCodes, setShowAccessCodes] = useState({});
    const [editForm, setEditForm] = useState({
        nombre: '',
        rfc: '',
        correo: '',
        telefono: '',
        direccion: '',
        licencia: { plan: '', fecha_inicio: '', estado: true },
        contratante: { nombre: '', correo: '', telefono: '', puesto: '' }
    });

    const isAurontekHQ = (empresa) => {
        return empresa.nombre?.toLowerCase().includes('aurontek') &&
            empresa.nombre?.toLowerCase().includes('hq');
    };

    const toggleAccessCodeVisibility = (empresa) => {
        // Check if it's Aurontek HQ and code is hidden
        if (isAurontekHQ(empresa) && !showAccessCodes[empresa._id]) {
            setCurrentEmpresa(empresa);
            setPendingAction({ type: 'viewCode', empresa });
            setOpenHQCode(true);
        } else {
            setShowAccessCodes(prev => ({
                ...prev,
                [empresa._id]: !prev[empresa._id]
            }));
        }
    };

    const handleRegenerarCodigo = (empresa) => {
        setCurrentEmpresa(empresa);

        if (isAurontekHQ(empresa)) {
            setPendingAction({ type: 'regenerate', empresa });
            setOpenHQCode(true);
        } else {
            setOpenRegenerateConfirm(true);
        }
    };

    const handleConfirmRegenerate = async () => {
        try {
            const result = await regenerarCodigoAcceso(currentEmpresa._id);
            setOpenRegenerateConfirm(false);
            alert(`Código regenerado exitosamente: ${result.codigo_acceso}\n\n${result.msg}`);
            if (onUpdate) onUpdate();
        } catch (e) {
            console.error('Error regenerating code:', e);
            setOpenRegenerateConfirm(false);
            alert('Error al regenerar código: ' + (e.response?.data?.msg || e.message));
        }
    };

    const handleViewClick = (empresa) => {
        setCurrentEmpresa(empresa);

        if (isAurontekHQ(empresa)) {
            setPendingAction({ type: 'view', empresa });
            setOpenHQCode(true);
        } else {
            setOpenView(true);
        }
    };

    const handleEditClick = (empresa) => {
        setCurrentEmpresa(empresa);
        const licencia = empresa.licencia?.[0] || { plan: 'Mensual', fecha_inicio: new Date().toISOString().split('T')[0], estado: true };
        const contratante = empresa.contratantes?.[0] || { nombre: '', correo: '', telefono: '', puesto: '' };

        setEditForm({
            nombre: empresa.nombre || '',
            rfc: empresa.rfc || '',
            correo: empresa.correo || '',
            telefono: empresa.telefono || '',
            direccion: empresa.direccion || '',
            licencia: {
                plan: licencia.plan || 'Mensual',
                fecha_inicio: licencia.fecha_inicio ? new Date(licencia.fecha_inicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                estado: licencia.estado !== undefined ? licencia.estado : true
            },
            contratante: {
                nombre: contratante.nombre || '',
                correo: contratante.correo || '',
                telefono: contratante.telefono || '',
                puesto: contratante.puesto || ''
            }
        });

        if (isAurontekHQ(empresa)) {
            setPendingAction({ type: 'edit', empresa });
            setOpenHQCode(true);
        } else {
            setOpenEdit(true);
        }
    };

    const handleDeleteClick = (empresa) => {
        setCurrentEmpresa(empresa);

        if (isAurontekHQ(empresa)) {
            setPendingAction({ type: 'delete', empresa });
            setOpenHQCode(true);
        } else {
            setOpenDelete(true);
        }
    };

    const handleToggleLicencia = async (empresa) => {
        if (isAurontekHQ(empresa)) {
            setCurrentEmpresa(empresa);
            setPendingAction({ type: 'toggleLicense', empresa });
            setOpenHQCode(true);
        } else {
            try {
                await toggleLicenciaEmpresa(empresa._id, !empresa.activo);
                if (onUpdate) onUpdate();
            } catch (e) {
                console.error('Error toggling license:', e);
                alert('Error al cambiar estado de licencia: ' + (e.response?.data?.msg || e.message));
            }
        }
    };

    const handleHQCodeSubmit = () => {
        if (!hqCodeInput.trim()) {
            alert('Debe ingresar el código de protección de Aurontek HQ');
            return;
        }

        const action = pendingAction?.type;

        if (action === 'view') {
            console.log('[DEBUG] Opening view dialog - currentEmpresa:', currentEmpresa);
            console.log('[DEBUG] Pending action empresa:', pendingAction?.empresa);
            setOpenHQCode(false);
            setOpenView(true);
            setHqCodeInput('');
            setPendingAction(null);
        } else if (action === 'edit') {
            setOpenHQCode(false);
            setOpenEdit(true);
        } else if (action === 'delete') {
            setOpenHQCode(false);
            setOpenDelete(true);
        } else if (action === 'viewCode') {
            // Validate HQ code (you can add backend validation here)
            setShowAccessCodes(prev => ({
                ...prev,
                [currentEmpresa._id]: true
            }));
            setOpenHQCode(false);
            setHqCodeInput('');
            setPendingAction(null);
        } else if (action === 'regenerate') {
            setOpenHQCode(false);
            setOpenRegenerateConfirm(true);
        } else if (action === 'toggleLicense') {
            setOpenHQCode(false);
            // Execute license toggle
            toggleLicenciaEmpresa(currentEmpresa._id, !currentEmpresa.activo)
                .then(() => {
                    setHqCodeInput('');
                    setPendingAction(null);
                    if (onUpdate) onUpdate();
                })
                .catch(e => {
                    console.error('Error toggling license:', e);
                    alert('Error al cambiar estado de licencia: ' + (e.response?.data?.msg || e.message));
                    setHqCodeInput('');
                    setPendingAction(null);
                });
        }
    };

    const handleSaveEdit = async () => {
        try {
            const hqCode = isAurontekHQ(currentEmpresa) ? hqCodeInput : null;

            const payload = {
                nombre: editForm.nombre,
                rfc: editForm.rfc,
                correo: editForm.correo,
                telefono: editForm.telefono,
                direccion: editForm.direccion,
                licencia: [{
                    plan: editForm.licencia.plan,
                    fecha_inicio: new Date(editForm.licencia.fecha_inicio),
                    estado: editForm.licencia.estado
                }],
                contratantes: [{
                    nombre: editForm.contratante.nombre,
                    correo: editForm.contratante.correo,
                    telefono: editForm.contratante.telefono,
                    puesto: editForm.contratante.puesto
                }]
            };

            await actualizarEmpresa(currentEmpresa._id, payload, hqCode);
            setOpenEdit(false);
            setHqCodeInput('');
            setPendingAction(null);
            if (onUpdate) onUpdate();
            alert('Empresa actualizada correctamente.');
        } catch (e) {
            console.error('Error updating company:', e);
            alert('Error al actualizar: ' + (e.response?.data?.msg || e.message));
        }
    };

    const handleConfirmDelete = async () => {
        try {
            const hqCode = isAurontekHQ(currentEmpresa) ? hqCodeInput : null;
            await eliminarEmpresa(currentEmpresa._id, hqCode);
            setOpenDelete(false);
            setHqCodeInput('');
            setPendingAction(null);
            if (onUpdate) onUpdate();
            alert('Empresa eliminada correctamente.');
        } catch (e) {
            console.error('Error deleting company:', e);
            alert('Error al eliminar: ' + (e.response?.data?.msg || e.message));
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('es-MX');
    };

    const columns = [
        {
            field: 'nombre',
            headerName: 'Empresa',
            width: 250,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {params.row.logo && (
                        <Avatar
                            src={params.row.logo}
                            alt={params.value}
                            sx={{ width: 32, height: 32 }}
                        />
                    )}
                    <Typography variant="body2">{params.value}</Typography>
                    {isAurontekHQ(params.row) && (
                        <Chip
                            label="HQ"
                            size="small"
                            color="warning"
                            sx={{ ml: 1, height: 20, fontSize: '0.65rem' }}
                        />
                    )}
                </Box>
            )
        },
        { field: 'rfc', headerName: 'RFC', width: 140 },
        { field: 'correo', headerName: 'Contacto', width: 200 },
        {
            field: 'codigo_acceso',
            headerName: 'Código Acceso',
            width: 200,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                        variant="body2"
                        sx={{
                            bgcolor: '#e3f2fd',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            color: 'primary.main',
                            minWidth: '90px',
                            textAlign: 'center'
                        }}
                    >
                        {showAccessCodes[params.row._id] ? params.value : '••••••••'}
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={() => toggleAccessCodeVisibility(params.row)}
                    >
                        {showAccessCodes[params.row._id] ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                    <Tooltip title="Regenerar código">
                        <IconButton
                            size="small"
                            color="warning"
                            onClick={() => handleRegenerarCodigo(params.row)}
                        >
                            <RefreshIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        },
        {
            field: 'activo',
            headerName: 'Licencia',
            width: 150,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Tooltip title={params.value ? "Suspender licencia" : "Activar licencia"}>
                        <IconButton
                            onClick={() => handleToggleLicencia(params.row)}
                            color={params.value ? "success" : "error"}
                            size="small"
                        >
                            {params.value ? <CheckCircleIcon /> : <BlockIcon />}
                        </IconButton>
                    </Tooltip>
                    <Chip
                        label={params.value ? "Activa" : "Suspendida"}
                        color={params.value ? "success" : "error"}
                        size="small"
                    />
                </Box>
            )
        },
        {
            field: 'actions',
            headerName: 'Acciones',
            width: 150,
            renderCell: (params) => (
                <Box>
                    <Tooltip title="Ver detalles">
                        <IconButton
                            color="info"
                            size="small"
                            onClick={() => handleViewClick(params.row)}
                        >
                            <VisibilityIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar empresa">
                        <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleEditClick(params.row)}
                        >
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar empresa">
                        <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDeleteClick(params.row)}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ];

    // Pre-sort rows to put HQ at top
    // DataGrid sorts by columns usually, but we can pass sorted data.
    // However, if the user sorts by another column, this order might be lost unless we use a custom sort comparator.
    // For now, passing sorted rows is a good start.
    const sortedRows = [...empresas].sort((a, b) => {
        const aIsHQ = isAurontekHQ(a);
        const bIsHQ = isAurontekHQ(b);
        if (aIsHQ && !bIsHQ) return -1;
        if (!aIsHQ && bIsHQ) return 1;
        return 0;
    });

    return (
        <Box>
            <Paper elevation={2} sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={sortedRows}
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

            {/* View Details Dialog */}
            <Dialog open={openView} onClose={() => setOpenView(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {currentEmpresa?.logo && (
                            <Avatar
                                src={currentEmpresa.logo}
                                alt={currentEmpresa.nombre}
                                sx={{ width: 56, height: 56 }}
                            />
                        )}
                        <Box>
                            <Typography variant="h6">{currentEmpresa?.nombre}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Detalles de la Empresa
                            </Typography>
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Información General</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">RFC</Typography>
                            <Typography variant="body1">{currentEmpresa?.rfc || 'N/A'}</Typography>
                        </Grid>

                        <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Correo</Typography>
                            <Typography variant="body1">{currentEmpresa?.correo || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Teléfono</Typography>
                            <Typography variant="body1">{currentEmpresa?.telefono || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">Dirección</Typography>
                            <Typography variant="body1">{currentEmpresa?.direccion || 'N/A'}</Typography>
                        </Grid>
                    </Grid>

                    <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Licencia</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                        <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">Plan</Typography>
                            <Typography variant="body1">{currentEmpresa?.licencia?.[0]?.plan || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">Fecha Inicio</Typography>
                            <Typography variant="body1">{formatDate(currentEmpresa?.licencia?.[0]?.fecha_inicio)}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">Fecha Fin</Typography>
                            <Typography variant="body1">{formatDate(currentEmpresa?.licencia?.[0]?.fecha_fin)}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">Estado</Typography>
                            <Chip
                                label={currentEmpresa?.activo ? "Activa" : "Suspendida"}
                                color={currentEmpresa?.activo ? "success" : "error"}
                                size="small"
                            />
                        </Grid>
                    </Grid>

                    <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Contratante</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Nombre</Typography>
                            <Typography variant="body1">{currentEmpresa?.contratantes?.[0]?.nombre || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Puesto</Typography>
                            <Typography variant="body1">{currentEmpresa?.contratantes?.[0]?.puesto || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Correo</Typography>
                            <Typography variant="body1">{currentEmpresa?.contratantes?.[0]?.correo || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Teléfono</Typography>
                            <Typography variant="body1">{currentEmpresa?.contratantes?.[0]?.telefono || 'N/A'}</Typography>
                        </Grid>
                    </Grid>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
                        Creado: {formatDate(currentEmpresa?.creado)} | Actualizado: {formatDate(currentEmpresa?.actualizado)}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenView(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            {/* HQ Protection Dialog */}
            <Dialog open={openHQCode} onClose={() => { setOpenHQCode(false); setHqCodeInput(''); setPendingAction(null); }}>
                <DialogTitle>Protección Aurontek HQ</DialogTitle>
                <DialogContent sx={{ minWidth: 400, pt: 2 }}>
                    <Typography color="warning.main" sx={{ mb: 2 }}>
                        ⚠️ Esta operación en Aurontek HQ requiere un código de protección especial.
                    </Typography>
                    <TextField
                        fullWidth
                        type="password"
                        label="Código de Protección HQ"
                        value={hqCodeInput}
                        onChange={(e) => setHqCodeInput(e.target.value)}
                        autoFocus
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleHQCodeSubmit();
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setOpenHQCode(false); setHqCodeInput(''); setPendingAction(null); }}>Cancelar</Button>
                    <Button variant="contained" onClick={handleHQCodeSubmit}>Continuar</Button>
                </DialogActions>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="md" fullWidth>
                <DialogTitle>Editar Empresa</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Datos de la Empresa</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Nombre Empresa"
                                value={editForm.nombre}
                                onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="RFC"
                                value={editForm.rfc}
                                onChange={(e) => setEditForm({ ...editForm, rfc: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Correo de Contacto"
                                value={editForm.correo}
                                onChange={(e) => setEditForm({ ...editForm, correo: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Teléfono"
                                value={editForm.telefono}
                                onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Dirección"
                                value={editForm.direccion}
                                onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                            />
                        </Grid>
                    </Grid>

                    <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Licencia</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                select
                                label="Plan"
                                value={editForm.licencia.plan}
                                onChange={(e) => setEditForm({ ...editForm, licencia: { ...editForm.licencia, plan: e.target.value } })}
                            >
                                <MenuItem value="Mensual">Mensual</MenuItem>
                                <MenuItem value="Trimestral">Trimestral</MenuItem>
                                <MenuItem value="Anual">Anual</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Fecha de Inicio"
                                value={editForm.licencia.fecha_inicio}
                                onChange={(e) => setEditForm({ ...editForm, licencia: { ...editForm.licencia, fecha_inicio: e.target.value } })}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                    </Grid>

                    <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Contratante</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Nombre del Contratante"
                                value={editForm.contratante.nombre}
                                onChange={(e) => setEditForm({ ...editForm, contratante: { ...editForm.contratante, nombre: e.target.value } })}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Correo del Contratante"
                                value={editForm.contratante.correo}
                                onChange={(e) => setEditForm({ ...editForm, contratante: { ...editForm.contratante, correo: e.target.value } })}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Teléfono del Contratante"
                                value={editForm.contratante.telefono}
                                onChange={(e) => setEditForm({ ...editForm, contratante: { ...editForm.contratante, telefono: e.target.value } })}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Puesto del Contratante"
                                value={editForm.contratante.puesto}
                                onChange={(e) => setEditForm({ ...editForm, contratante: { ...editForm.contratante, puesto: e.target.value } })}
                            />
                        </Grid>
                    </Grid>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                        Nota: El logo de la empresa solo puede ser modificado por el Admin Interno desde su panel.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEdit(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSaveEdit}>Guardar Cambios</Button>
                </DialogActions>
            </Dialog>

            {/* Regenerate Access Code Confirmation Dialog */}
            <Dialog open={openRegenerateConfirm} onClose={() => setOpenRegenerateConfirm(false)}>
                <DialogTitle>Regenerar Código de Acceso</DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2 }}>
                        ¿Está seguro que desea regenerar el código de acceso para <strong>{currentEmpresa?.nombre}</strong>?
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        • Se generará un nuevo código aleatorio de 8 caracteres<br />
                        • El código anterior quedará inválido<br />
                        • Se enviará una notificación al Admin Interno de la empresa
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRegenerateConfirm(false)}>Cancelar</Button>
                    <Button variant="contained" color="warning" onClick={handleConfirmRegenerate}>
                        Regenerar Código
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    <Typography color="error" sx={{ mb: 2 }}>
                        ⚠️ ¿Está seguro que desea eliminar la empresa <strong>{currentEmpresa?.nombre}</strong>?
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Esta acción eliminará permanentemente la empresa y todos sus usuarios asociados.
                        Esta operación no se puede deshacer.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDelete(false)}>Cancelar</Button>
                    <Button variant="contained" color="error" onClick={handleConfirmDelete}>
                        Eliminar Empresa
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EmpresasTable;
