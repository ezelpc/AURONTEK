import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { 
  Box, Typography, Paper, Chip, Button, Dialog, 
  DialogTitle, DialogContent, DialogActions, Grid, Divider, Fade
} from '@mui/material';
import { 
  Add, Visibility, Close, Person, SupportAgent, 
  Image as ImageIcon, OpenInNew 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getTicketsEmpresa } from '../../services/empresaService';

const TicketsEmpresa = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  
  const user = JSON.parse(localStorage.getItem('usuario') || '{}');
  const userRol = user.rol;

  // Estados para los Modales
  const [openDetail, setOpenDetail] = useState(false);
  const [openPreview, setOpenPreview] = useState(false); // Nuevo estado para la imagen
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    cargarTickets();
  }, []);

  const cargarTickets = async () => {
    const data = await getTicketsEmpresa();
    setTickets(data);
  };

  const handleVerTicket = (ticket) => {
    setSelectedTicket(ticket);
    setOpenDetail(true);
  };

  const handleCerrarDetail = () => {
    setOpenDetail(false);
    setSelectedTicket(null);
  };

  // Columnas Dinámicas
  const baseColumns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'asunto', headerName: 'Asunto', flex: 1, minWidth: 200 },
    { field: 'tipo', headerName: 'Tipo', width: 120 },
    { field: 'fecha', headerName: 'Fecha', width: 100 },
    { 
      field: 'prioridad', headerName: 'Prioridad', width: 110,
      renderCell: (params) => {
        const color = ['Alta','Critica'].includes(params.value) ? 'error' : params.value === 'Media' ? 'warning' : 'info';
        return <Chip label={params.value} color={color} size="small" />;
      }
    },
    { 
      field: 'estado', headerName: 'Estado', width: 110,
      renderCell: (params) => <Chip label={params.value} variant="outlined" color={params.value === 'Abierto' ? 'success' : 'default'} size="small" />
    }
  ];

  let dynamicColumns = [...baseColumns];
  if (['soporte', 'admin_empresa', 'superadmin'].includes(userRol)) {
    dynamicColumns.splice(2, 0, {
      field: 'nombreCreador', headerName: 'Solicitante', width: 150,
      renderCell: (params) => <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Person fontSize="small" color="action" />{params.value}</Box>
    });
  }
  if (['usuario_final', 'becario', 'admin_empresa', 'superadmin'].includes(userRol)) {
    dynamicColumns.splice(3, 0, {
      field: 'nombreAsignado', headerName: 'Atendido Por', width: 150,
      renderCell: (params) => <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><SupportAgent fontSize="small" color={params.value === 'Sin asignar' ? 'disabled' : 'primary'} /><Typography variant="body2" color={params.value === 'Sin asignar' ? 'text.secondary' : 'text.primary'}>{params.value}</Typography></Box>
    });
  }
  dynamicColumns.push({
    field: 'acciones', headerName: 'Ver', width: 80,
    renderCell: (params) => <Button size="small" onClick={() => handleVerTicket(params.row)}><Visibility /></Button>
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">{userRol === 'usuario_final' ? 'Mis Solicitudes' : 'Gestión de Tickets'}</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/empresa/tickets/nuevo')}>Nuevo Ticket</Button>
      </Box>
      
      <Paper elevation={2} sx={{ height: 500, width: '100%' }}>
        <DataGrid rows={tickets} columns={dynamicColumns} pageSize={10} disableSelectionOnClick initialState={{ sorting: { sortModel: [{ field: 'fecha', sort: 'desc' }] } }} />
      </Paper>

      {/* --- MODAL 1: DETALLE DEL TICKET --- */}
      <Dialog open={openDetail} onClose={handleCerrarDetail} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Ticket #{selectedTicket?.id}</Typography>
          <Chip label={selectedTicket?.estado} color="primary" size="small" />
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}><Typography variant="h6">{selectedTicket?.asunto}</Typography></Grid>
            <Divider sx={{ width: '100%', my: 1 }} />
            <Grid item xs={6}><Typography variant="caption" color="textSecondary">Solicitado por:</Typography><Typography variant="body1">{selectedTicket?.nombreCreador}</Typography></Grid>
            <Grid item xs={6}><Typography variant="caption" color="textSecondary">Asignado a:</Typography><Typography variant="body1">{selectedTicket?.nombreAsignado}</Typography></Grid>
            <Grid item xs={6}><Typography variant="caption" color="textSecondary">Tipo:</Typography><Typography variant="body1">{selectedTicket?.tipo}</Typography></Grid>
            <Grid item xs={6}><Typography variant="caption" color="textSecondary">Prioridad:</Typography><Typography variant="body1" fontWeight="bold">{selectedTicket?.prioridad}</Typography></Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="textSecondary">Descripción:</Typography>
              <Paper variant="outlined" sx={{ p: 2, mt: 0.5, bgcolor: '#fafafa' }}>
                <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>{selectedTicket?.descripcion}</Typography>
              </Paper>
            </Grid>

            {/* SECCIÓN EVIDENCIA */}
            {selectedTicket?.adjunto && (
              <Grid item xs={12}>
                <Typography variant="caption" color="textSecondary">Evidencia Adjunta:</Typography>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, mt: 0.5, bgcolor: '#eef6fc', borderColor: '#bbdefb',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', '&:hover': { bgcolor: '#e3f2fd' }
                  }}
                  onClick={() => setOpenPreview(true)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 50, height: 50, bgcolor: 'white', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ddd' }}>
                      {selectedTicket.adjuntoUrl ? (
                         <img src={selectedTicket.adjuntoUrl} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} />
                      ) : (
                         <ImageIcon color="primary" />
                      )}
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight="bold" color="primary.main">{selectedTicket.adjunto}</Typography>
                      <Typography variant="caption" color="textSecondary">Clic para previsualizar</Typography>
                    </Box>
                  </Box>
                  <OpenInNew color="action" fontSize="small" />
                </Paper>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={handleCerrarDetail} startIcon={<Close />}>Cerrar</Button></DialogActions>
      </Dialog>

      {/* --- MODAL 2: PREVISUALIZACIÓN DE IMAGEN --- */}
      <Dialog 
        open={openPreview} 
        onClose={() => setOpenPreview(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="subtitle1">{selectedTicket?.adjunto}</Typography>
          <Button size="small" onClick={() => setOpenPreview(false)} startIcon={<Close />}>Cerrar</Button>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', p: 0 }}>
          {selectedTicket?.adjuntoUrl ? (
            <img 
              src={selectedTicket.adjuntoUrl} 
              alt="Evidencia Full" 
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} 
            />
          ) : (
            // Placeholder por si es un dato mock antiguo sin imagen real
            <img 
              src="https://placehold.co/600x400?text=Vista+Previa+de+Archivo" 
              alt="Placeholder"
              style={{ maxWidth: '100%', maxHeight: '80vh' }}
            />
          )}
        </DialogContent>
      </Dialog>

    </Box>
  );
};

export default TicketsEmpresa;