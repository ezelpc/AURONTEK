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
  Category as CategoryIcon
} from '@mui/icons-material';

import { useLanguage } from '../../contexts/LanguageContext';
import { NotificationBell } from '../../contexts/NotificationContext';
import { Translate } from '@mui/icons-material'; // Import icon

const LayoutEmpresa = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, toggleLanguage, t } = useLanguage(); // Use hook
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
            main: '#3b82f6', // Premium Tech Blue
          },
          background: {
            default: darkMode ? '#0f172a' : '#f8fafc', // Slate 900 / 50
            paper: darkMode ? '#1e293b' : '#ffffff',   // Slate 800 / White
          },
          text: {
            primary: darkMode ? '#f1f5f9' : '#0f172a',
            secondary: darkMode ? '#94a3b8' : '#64748b',
          },
        },
        typography: {
          fontFamily: "'Inter', sans-serif",
        },
        components: {
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                color: darkMode ? '#f1f5f9' : '#0f172a',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                borderBottom: darkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
              },
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: {
                backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                borderRight: darkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
              },
            },
          },
          MuiListItemButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                margin: '4px 8px',
                '&.Mui-selected': {
                  backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
                  color: '#3b82f6',
                  '&:hover': {
                    backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.25)' : '#dbeafe',
                  },
                },
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
  // Correction: 'usuario_final' is not DB enum. Fallback to 'usuario' if undefined.
  const rol = user.rol || 'usuario';
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
      if (typeof window !== 'undefined') {
        if (newMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }
      return newMode;
    });
    // handleCloseMenu(); // Optional: keep menu open to toggle language too?
  };

  const handleToggleLanguage = () => {
    toggleLanguage();
    // handleCloseMenu();
  };

  // Sync initial dark mode class
  React.useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const handleHelp = () => {
    // console.log('Abrir ayuda');
    handleCloseMenu();
  };

  const allMenuItems = [
    {
      text: t('dashboard'),
      icon: <Dashboard />,
      path: '/empresa/dashboard',
      roles: ['admin-interno', 'soporte', 'usuario', 'becario', 'beca-soporte', 'resolutor-interno', 'soporte-plataforma', 'resolutor-empresa', 'cliente-final'],
    },
    {
      text: t('tickets'),
      icon: <ConfirmationNumber />,
      path: '/empresa/tickets',
      roles: ['admin-interno', 'soporte', 'resolutor-interno', 'soporte-plataforma', 'resolutor-empresa'],
    },
    {
      text: t('my_tickets'),
      icon: <ConfirmationNumber />,
      path: '/empresa/tickets',
      roles: ['usuario', 'becario', 'beca-soporte', 'cliente-final'],
    },
    {
      text: t('create_ticket'),
      icon: <AddBox />,
      path: '/empresa/tickets/nuevo',
      roles: ['admin-interno', 'usuario', 'becario', 'cliente-final'],
    },
    {
      text: t('services'),
      icon: <CategoryIcon />,
      path: '/empresa/servicios',
      roles: ['admin-interno', 'soporte', 'usuario', 'becario', 'beca-soporte', 'resolutor-interno', 'soporte-plataforma', 'resolutor-empresa', 'cliente-final'],
    },
    {
      text: t('users'),
      icon: <People />,
      path: '/empresa/usuarios',
      roles: ['admin-interno', 'resolutor-interno', 'soporte-plataforma'], // Maybe allowed to view users?
    },
  ];

  const menuItems = allMenuItems.filter((item) => item.roles.includes(rol));

  // Determine current page title
  const getPageTitle = () => {
    const { pathname } = location;

    if (pathname.startsWith('/empresa/perfil')) {
      return t('profile');
    }
    if (pathname.startsWith('/empresa/tickets/nuevo')) {
      return t('create_ticket');
    }
    // Casos para roles con la misma ruta base pero diferente texto
    if (rol === 'usuario' || rol === 'becario' || rol === 'beca-soporte') {
      if (pathname.startsWith('/empresa/tickets')) return t('my_tickets');
    } else {
      if (pathname.startsWith('/empresa/tickets')) return t('tickets');
    }

    const currentItem = menuItems.find(item => pathname.startsWith(item.path));
    return currentItem ? currentItem.text : t('dashboard');
  };
  const pageTitle = getPageTitle();


  const formatRol = (rol) => {
    const roleMap = {
      'admin-general': 'ADMIN ROOT',
      'admin-interno': 'ADMINISTRADOR',
      'soporte': 'RESOLUTOR',
      'usuario': 'USUARIO FINAL',
      'beca-soporte': 'BECARIO',
    };
    return roleMap[rol] || rol.toUpperCase();
  };

  const drawer = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isCollapsed ? 'center' : 'flex-start',
          py: 3,
          px: isCollapsed ? 1 : 3,
          background: darkMode
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
        }}
      >
        {isCollapsed ? (
          <Avatar
            src={'/assets/logoArutontek.png'}
            sx={{ width: 40, height: 40, mb: 1, bgcolor: 'transparent', variant: 'rounded' }}
          />
        ) : (
          <Box sx={{ width: '100%' }}>
            <Typography variant="overline" sx={{ opacity: 0.6, fontSize: '0.7rem', display: 'block', mb: 0.5, letterSpacing: '1px' }}>
              {t('portal')}
            </Typography>
            <Typography variant="h6" noWrap fontWeight="800" sx={{ backgroundImage: 'linear-gradient(45deg, #3b82f6, #8b5cf6)', backgroundClip: 'text', color: 'transparent', mb: 1 }}>
              {nombreEmpresa}
            </Typography>
          </Box>
        )}
      </Toolbar>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1.5 }}>
        <List sx={{ pt: 1 }}>
          {menuItems.map((item, index) => (
            <ListItem key={index} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={isCollapsed ? item.text : ''} placement="right">
                <ListItemButton
                  selected={location.pathname === item.path || location.pathname.startsWith(item.path + '/')}
                  onClick={() => {
                    navigate(item.path);
                    if (!isPermanentDrawer) {
                      setMobileOpen(false);
                    }
                  }}
                  sx={{
                    justifyContent: isCollapsed ? 'center' : 'initial',
                    px: isCollapsed ? 1 : 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: isCollapsed ? 0 : 2,
                      justifyContent: 'center',
                      color: (location.pathname === item.path) ? 'primary.main' : 'text.secondary',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{ opacity: isCollapsed ? 0 : 1 }}
                    primaryTypographyProps={{
                      fontWeight: (location.pathname === item.path) ? 600 : 500,
                      fontSize: '0.9rem',
                    }}
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>
      </Box>
      <Divider sx={{ opacity: 0.1, my: 1 }} />
      {isPermanentDrawer && (
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
          <IconButton onClick={handleDrawerToggle} size="small" sx={{ border: '1px solid', borderColor: 'divider' }}>
            {isCollapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
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
          elevation={0}
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
              <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>
                {pageTitle}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Notifications */}
              <NotificationBell />

              <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2, color: 'text.primary' }}>
                  {user.nombre || 'Usuario'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.8 }}>
                  <Chip
                    label={formatRol(rol)}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      bgcolor: 'rgba(59, 130, 246, 0.1)',
                      color: 'primary.main',
                      border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}
                  />
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: activo ? '#10b981' : '#ef4444',
                      boxShadow: `0 0 0 2px ${activo ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                    }}
                  />
                </Box>
              </Box>
              <Tooltip title="Cuenta">
                <IconButton onClick={handleOpenMenu} sx={{ p: 0.5, border: '2px solid', borderColor: 'divider' }}>
                  <Avatar
                    alt={user.nombre}
                    src={user.fotoPerfil || undefined}
                    sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}
                  >
                    {user.nombre?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                </IconButton>
              </Tooltip>
            </Box>

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
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.12))',
                  '& .MuiMenuItem-root': { px: 2, py: 1.5, gap: 1.5 },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => navigate('/empresa/perfil')}>
                <ListItemIcon>
                  <Person fontSize="small" />
                </ListItemIcon>
                <Typography variant="body2">{t('profile')}</Typography>
              </MenuItem>
              <MenuItem onClick={handleToggleDarkMode}>
                <ListItemIcon>
                  {darkMode ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
                </ListItemIcon>
                <Typography variant="body2">
                  {darkMode ? t('light_mode') : t('dark_mode')}
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleToggleLanguage}>
                <ListItemIcon>
                  <Translate fontSize="small" />
                </ListItemIcon>
                <Typography variant="body2">
                  {language === 'es' ? 'English' : 'Español'}
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleHelp}>
                <ListItemIcon>
                  <Help fontSize="small" />
                </ListItemIcon>
                <Typography variant="body2">{t('help')}</Typography>
              </MenuItem>
              <Divider sx={{ my: 1 }} />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <ListItemIcon>
                  <Logout fontSize="small" color="error" />
                </ListItemIcon>
                <Typography variant="body2" fontWeight="600">{t('logout')}</Typography>
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
            bgcolor: 'background.default',
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