import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, CssBaseline, AppBar, Toolbar, Typography, Drawer, 
  List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  IconButton, Avatar, Badge, Divider, Tooltip 
} from '@mui/material';

// Iconos
import { 
  Menu as MenuIcon, 
  Dashboard as DashboardIcon, 
  Business as BusinessIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  ConfirmationNumber as TicketIcon,
  AddBox as AddBoxIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Category as CategoryIcon
} from '@mui/icons-material';

// Ancho del sidebar
const drawerWidth = 240;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Para saber en qué ruta estamos
  const [mobileOpen, setMobileOpen] = useState(false);

  // Alternar menú en móvil
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Función para Cerrar Sesión
  const handleLogout = () => {
    // 1. Limpiar almacenamiento
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('admin');
    
    // 2. Redirigir al login
    navigate('/');
  };

  // Configuración de los ítems del menú
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Mis Tickets', icon: <TicketIcon />, path: '/tickets' },
    { text: 'Crear Ticket', icon: <AddBoxIcon />, path: '/tickets/nuevo' },
    { text: 'Usuarios', icon: <PeopleIcon />, path: '/usuarios' },
    { text: 'Catálogo de Servicios', icon: <CategoryIcon />, path: '/servicios' },
    { text: 'Registrar Empresa', icon: <BusinessIcon />, path: '/registrar-empresa' },
    { text: 'Mi Perfil', icon: <PersonIcon />, path: '/perfil' },
  ];

  // Contenido del Sidebar
  const drawerContent = (
    <div>
      {/* Logo / Título del Sidebar */}
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" noWrap component="div" sx={{ color: 'primary.main', fontWeight: 'bold', letterSpacing: 1 }}>
          AURONTEK
        </Typography>
      </Toolbar>
      <Divider />
      
      <List>
        {menuItems.map((item) => {
          // Verificamos si la ruta actual coincide para dejarlo "seleccionado"
          const isActive = location.pathname === item.path;

          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton 
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false); // Cierra el menú en móvil al hacer clic
                }}
                selected={isActive}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.main',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive ? 'white' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* --- NAVBAR SUPERIOR (APPBAR) --- */}
      <AppBar 
        position="fixed" 
        sx={{ 
          width: { sm: `calc(100% - ${drawerWidth}px)` }, 
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: 1
        }}
      >
        <Toolbar>
          {/* Botón Hamburguesa (Solo móvil) */}
          <IconButton 
            color="inherit" 
            edge="start" 
            onClick={handleDrawerToggle} 
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Título de la página actual (Opcional) */}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'medium' }}>
            Panel Administrativo
          </Typography>
          
          {/* Iconos a la derecha */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Notificaciones">
              <IconButton size="large" color="inherit">
                <Badge badgeContent={0} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Cerrar Sesión">
              <IconButton onClick={handleLogout} color="inherit" sx={{ ml: 1 }}>
                 <LogoutIcon color="action" />
              </IconButton>
            </Tooltip>
            
            {/* Avatar Simple */}
            <Avatar sx={{ width: 35, height: 35, bgcolor: 'primary.main', ml: 1 }}>A</Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      {/* --- SIDEBAR (DRAWER) --- */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        {/* Mobile Drawer (Temporary) */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ 
            display: { xs: 'block', sm: 'none' }, 
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } 
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Drawer (Permanent) */}
        <Drawer
          variant="permanent"
          sx={{ 
            display: { xs: 'none', sm: 'block' }, 
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } 
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* --- CONTENIDO PRINCIPAL (PÁGINAS) --- */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerWidth}px)` }, 
          minHeight: '100vh',
          bgcolor: '#f4f6f8' // Fondo gris muy suave para resaltar las tarjetas blancas
        }}
      >
        {/* Este Toolbar vacío empuja el contenido hacia abajo para que no quede oculto por el AppBar */}
        <Toolbar /> 
        
        {/* AQUÍ SE CARGAN TUS PÁGINAS (Dashboard, Tickets, etc.) */}
        <Outlet /> 
      </Box>
    </Box>
  );
};

export default MainLayout;