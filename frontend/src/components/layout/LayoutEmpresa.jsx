import React, { useState, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Divider,
  Tooltip,
  Chip,
  Menu,
  MenuItem,
  ThemeProvider,
  createTheme,
  Button,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  ConfirmationNumber,
  AddBox,
  Logout,
  Person,
  DarkMode,
  LightMode,
  Help,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

const LayoutEmpresa = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: darkMode ? '#90a4ae' : '#0288d1',
          },
          background: {
            default: darkMode ? '#121212' : '#f4f6f8',
            paper: darkMode ? '#1e1e1e' : '#ffffff',
          },
          text: {
            primary: darkMode ? '#e0e0e0' : '#212121',
            secondary: darkMode ? '#b0b0b0' : '#555555',
          },
        },
        components: {
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                color: darkMode ? '#e0e0e0' : '#333333',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              },
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: {
                backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
              },
            },
          },
        },
      }),
    [darkMode]
  );

  const [isCollapsed, setIsCollapsed] = useState(false);
  const isPermanentDrawer = useMediaQuery(theme.breakpoints.up('sm'));

  const handleDrawerToggle = () => {
    if (isPermanentDrawer) {
      setIsCollapsed(!isCollapsed);
    } else {
      setMobileOpen(!mobileOpen);
    }
  };

  const drawerWidth = isPermanentDrawer && isCollapsed ? 88 : 260;

  // Obtener usuario, empresa y rol
  const user = JSON.parse(localStorage.getItem('usuario') || '{}');
  const nombreEmpresa = sessionStorage.getItem('empresa_nombre') || 'Mi Empresa';
  const rol = user.rol || 'usuario_final';
  const activo = user.activo !== false;

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('empresa_email_recordado');
    sessionStorage.clear();
    handleCloseMenu();
    navigate('/acceso-empresa');
  };

  const handleToggleDarkMode = () => {
    setDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem('darkMode', String(newMode));
      return newMode;
    });
    handleCloseMenu();
  };

  const handleHelp = () => {
    console.log('Abrir ayuda');
    handleCloseMenu();
  };

  const allMenuItems = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/empresa/dashboard',
      roles: ['admin-interno', 'admin_empresa', 'soporte', 'usuario_final', 'becario', 'beca-soporte'],
    },
    {
      text: 'Gestión Tickets',
      icon: <ConfirmationNumber />,
      path: '/empresa/tickets',
      roles: ['admin-interno', 'admin_empresa', 'soporte'],
    },
    {
      text: 'Mis Tickets',
      icon: <ConfirmationNumber />,
      path: '/empresa/tickets',
      roles: ['usuario_final', 'becario', 'beca-soporte'],
    },
    {
      text: 'Crear Ticket',
      icon: <AddBox />,
      path: '/empresa/tickets/nuevo',
      roles: ['admin-interno', 'admin_empresa', 'usuario_final', 'becario'],
    },
    {
      text: 'Usuarios',
      icon: <People />,
      path: '/empresa/usuarios',
      roles: ['admin-interno', 'admin_empresa'],
    },
  ];

  const menuItems = allMenuItems.filter((item) => item.roles.includes(rol));

  // Determinar el título de la página actual
  const getPageTitle = () => {
    const { pathname } = location;

    if (pathname.startsWith('/empresa/perfil')) {
      return 'Mi Perfil';
    }
    if (pathname.startsWith('/empresa/tickets/nuevo')) {
      return 'Crear Ticket';
    }
    // Casos para roles con la misma ruta base pero diferente texto
    if (rol === 'usuario_final' || rol === 'becario' || rol === 'beca-soporte') {
      if (pathname.startsWith('/empresa/tickets')) return 'Mis Tickets';
    } else {
      if (pathname.startsWith('/empresa/tickets')) return 'Gestión Tickets';
    }

    const currentItem = menuItems.find(item => pathname.startsWith(item.path));
    return currentItem ? currentItem.text : 'Dashboard';
  };
  const pageTitle = getPageTitle();


  const formatRol = (rol) => {
    const roleMap = {
      'admin-general': 'ADMIN ROOT',
      'admin-interno': 'ADMIN',
      'soporte': 'SOPORTE',
      'usuario_final': 'USUARIO',
      'beca-soporte': 'BECARIO SOPORTE',
    };
    return roleMap[rol] || rol.toUpperCase();
  };

  const drawer = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar
        sx={{
          bgcolor: darkMode ? '#424242' : '#0288d1',
          color: 'white',
          flexDirection: 'column',
          alignItems: isCollapsed ? 'center' : 'flex-start',
          py: 2,
          px: isCollapsed ? 1 : 2,
          transition: 'all 0.2s ease-in-out',
        }}
      >
        {isCollapsed ? (
          <Avatar 
            src={'/src/assets/logoArutontek.png'} 
            sx={{ width: 40, height: 40, mb: 1, bgcolor: 'transparent' }}
          />
        ) : (
          <>
            <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 0.5 }}>
              PORTAL EMPRESA
            </Typography>
            <Typography variant="h6" noWrap fontWeight="bold" sx={{ mb: 1 }}>
              {nombreEmpresa}
            </Typography>
          </>
        )}
      </Toolbar>
      <Divider />
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <List sx={{ pt: 2 }}>
          {menuItems.map((item, index) => (
            <ListItem key={index} disablePadding sx={{ px: 1 }}>
              <Tooltip title={isCollapsed ? item.text : ''} placement="right">
                <ListItemButton
                  selected={location.pathname.startsWith(item.path)}
                  onClick={() => {
                    navigate(item.path);
                    if (!isPermanentDrawer) {
                      setMobileOpen(false);
                    }
                  }}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    justifyContent: isCollapsed ? 'center' : 'initial',
                    '&.Mui-selected': {
                      bgcolor: darkMode ? '#333' : '#e3f2fd',
                      '&:hover': { bgcolor: darkMode ? '#444' : '#e3f2fd' },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      bgcolor: darkMode ? '#555' : '#0288d1',
                      color: '#fff',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: isCollapsed ? 0 : 3,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{ opacity: isCollapsed ? 0 : 1 }}
                    primaryTypographyProps={{
                      fontWeight: location.pathname.startsWith(item.path) ? 600 : 400,
                      fontSize: '0.95rem',
                    }}
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>
      </Box>
      <Divider />
      {isPermanentDrawer && (
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
          <IconButton onClick={handleDrawerToggle}>
            {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>
      )}
    </div>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            transition: theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ color: 'inherit' }}>
                {pageTitle}
              </Typography>
            </Box>
            <Tooltip title="Abrir menú de usuario">
              <IconButton onClick={handleOpenMenu} sx={{ p: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                      {user.nombre || 'Usuario'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                        {formatRol(rol)}
                      </Typography>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: activo ? '#4caf50' : '#9e9e9e',
                        }}
                      />
                    </Box>
                  </Box>
                  <Avatar
                    alt={user.nombre}
                    src={user.fotoPerfil || '/default-avatar.png'}
                    sx={{ width: 40, height: 40, bgcolor: darkMode ? '#424242' : '#0288d1' }}
                  >
                    {user.nombre?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                </Box>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={openMenu}
              onClose={handleCloseMenu}
              onClick={handleCloseMenu}
              PaperProps={{
                elevation: 3,
                sx: {
                  mt: 1.5,
                  minWidth: 200,
                  '& .MuiMenuItem-root': { px: 2, py: 1.5 },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => navigate('/empresa/perfil')}>
                <ListItemIcon>
                  <Person fontSize="small" />
                </ListItemIcon>
                <Typography variant="body2">Mi Perfil</Typography>
              </MenuItem>
              <MenuItem onClick={handleToggleDarkMode}>
                <ListItemIcon>
                  {darkMode ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
                </ListItemIcon>
                <Typography variant="body2">
                  {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleHelp}>
                <ListItemIcon>
                  <Help fontSize="small" />
                </ListItemIcon>
                <Typography variant="body2">Ayuda</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <ListItemIcon>
                  <Logout fontSize="small" color="error" />
                </ListItemIcon>
                <Typography variant="body2">Cerrar Sesión</Typography>
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
        <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                transition: theme.transitions.create('width', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            minHeight: '100vh',
            bgcolor: (theme) => theme.palette.background.default,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          <Toolbar />
          <Outlet />
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default LayoutEmpresa;