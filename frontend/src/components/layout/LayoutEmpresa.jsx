import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, CssBaseline, AppBar, Toolbar, Typography, Drawer, List, 
  ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, 
  Avatar, Divider, Tooltip, Chip 
} from '@mui/material';
import { 
  Menu as MenuIcon, Dashboard, People, ConfirmationNumber, 
  AddBox, Logout, Person, School 
} from '@mui/icons-material';

const drawerWidth = 240;

const LayoutEmpresa = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Obtener usuario y rol
  const user = JSON.parse(localStorage.getItem('usuario') || '{}');
  const rol = user.rol || 'usuario_final';

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/acceso-empresa');
  };

  // Definir todos los items posibles
  const allMenuItems = [
    { 
      text: 'Dashboard', 
      icon: <Dashboard />, 
      path: '/empresa/dashboard', 
      roles: ['admin_empresa', 'soporte', 'usuario_final', 'becario'] 
    },
    { 
      text: 'Gestión Tickets', // Vista avanzada para resolver
      icon: <ConfirmationNumber />, 
      path: '/empresa/tickets', 
      roles: ['admin_empresa', 'soporte'] 
    },
    { 
      text: 'Mis Tickets', // Vista simple para usuario final
      icon: <ConfirmationNumber />, 
      path: '/empresa/tickets', 
      roles: ['usuario_final', 'becario'] 
    },
    { 
      text: 'Crear Ticket', 
      icon: <AddBox />, 
      path: '/empresa/tickets/nuevo', 
      roles: ['admin_empresa', 'usuario_final', 'becario'] // Soporte quizás no crea tickets para sí mismo
    },
    { 
      text: 'Usuarios', 
      icon: <People />, 
      path: '/empresa/usuarios', 
      roles: ['admin_empresa'] // Solo admin gestiona usuarios
    },
    { 
      text: 'Mi Perfil', 
      icon: <Person />, 
      path: '/empresa/perfil', 
      roles: ['admin_empresa', 'soporte', 'usuario_final', 'becario'] 
    },
  ];

  // Filtrar menú según rol
  const menuItems = allMenuItems.filter(item => item.roles.includes(rol));

  const drawer = (
    <div>
      <Toolbar sx={{ bgcolor: '#0288d1', color: 'white', flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
        <Typography variant="h6" noWrap fontWeight="bold">PORTAL EMPRESA</Typography>
        <Chip 
          label={rol.replace('_', ' ').toUpperCase()} 
          size="small" 
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', mt: 1 }} 
        />
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item, index) => (
          <ListItem key={index} disablePadding>
            <ListItemButton 
              selected={location.pathname === item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? '#0288d1' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ width: { sm: `calc(100% - ${drawerWidth}px)` }, ml: { sm: `${drawerWidth}px` }, bgcolor: 'white', color: '#333' }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">Hola, {user.nombre}</Typography>
          </Box>
          <IconButton onClick={handleLogout} color="error"><Logout /></IconButton>
        </Toolbar>
      </AppBar>
      
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }} open>
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, minHeight: '100vh', bgcolor: '#f4f6f8' }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default LayoutEmpresa;