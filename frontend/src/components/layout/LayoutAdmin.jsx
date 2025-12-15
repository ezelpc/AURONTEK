import React, { useState, useMemo, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    Box, AppBar, Toolbar, Typography, IconButton, Drawer, List,
    ListItem, ListItemIcon, ListItemText, Divider, Avatar, Badge, Menu, MenuItem,
    ThemeProvider, createTheme, CssBaseline, Tooltip, Chip, ListItemButton
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    Business as BusinessIcon,
    People as PeopleIcon,
    ConfirmationNumber as ConfirmationNumberIcon,
    ExitToApp as ExitToAppIcon,
    Notifications as NotificationsIcon,
    Settings as SettingsIcon,
    Person,
    DarkMode,
    LightMode,
    Help,
    Translate
} from '@mui/icons-material';

import { useLanguage } from '../../contexts/LanguageContext';
import { NotificationBell } from '../../contexts/NotificationContext';

const drawerWidth = 260;

const LayoutAdmin = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Hooks for Language and Theme (similar to LayoutEmpresa)
    const { language, toggleLanguage, t } = useLanguage();

    // Theme State
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
                        default: darkMode ? '#0f172a' : '#f8fafc',
                        paper: darkMode ? '#1e293b' : '#ffffff',
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
                    // --- NEW: Better Input Contrast in Dark Mode ---
                    MuiOutlinedInput: {
                        styleOverrides: {
                            root: {
                                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: darkMode ? '#94a3b8' : '#3b82f6',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#3b82f6',
                                },
                            },
                            notchedOutline: {
                                borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.23)',
                            },
                            input: {
                                color: darkMode ? '#f1f5f9' : '#0f172a',
                            },
                        },
                    },
                    MuiInputLabel: {
                        styleOverrides: {
                            root: {
                                color: darkMode ? '#94a3b8' : '#64748b',
                                '&.Mui-focused': {
                                    color: '#3b82f6',
                                },
                            },
                        },
                    },
                },
            }),
        [darkMode]
    );

    // Sync dark mode class
    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [darkMode]);

    const handleToggleDarkMode = () => {
        setDarkMode((prev) => {
            const newMode = !prev;
            localStorage.setItem('darkMode', String(newMode));
            return newMode;
        });
    };

    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const roleMap = {
        'admin-general': 'ADMIN ROOT',
        'admin-subroot': 'ADMIN SUBROOT',
        'admin-interno': 'ADMINISTRADOR',
    };
    const rolLabel = roleMap[usuario.rol] || (usuario.rol || 'ADMIN').toUpperCase();
    const activo = usuario.activo !== false; // Default true if undefined

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/admin/login');
    };

    const menuItems = [
        { text: 'Dashboard Global', icon: <DashboardIcon />, path: '/admin/dashboard' },
        { text: 'Empresas', icon: <BusinessIcon />, path: '/admin/empresas' },
        { text: 'Roles y Permisos', icon: <SettingsIcon />, path: '/admin/roles' }, // NEW: Roles
        { text: 'Tickets Globales', icon: <ConfirmationNumberIcon />, path: '/admin/tickets' },
        { text: 'Usuarios Globales', icon: <PeopleIcon />, path: '/admin/usuarios' },
    ];

    const drawer = (
        <Box sx={{
            height: '100%',
            color: darkMode ? 'white' : 'inherit',
            bgcolor: darkMode ? 'inherit' : '#1e293b' // Keep sidebar dark in light mode if that was the style, OR adhere to theme. 
            // LayoutEmpresa changes sidebar bg based on mode. I will stick to LayoutEmpresa behavior (theme based).
            // WAIT, looking at LayoutEmpresa: paper bg is theme.background.paper.
            // But let's check the original code... original was hardcoded dark #1e293b.
            // If I use ThemeProvider, the drawer will assume the paper color.
            // To make it look like the screenshot (Dark sidebar), I might need to override it if I want "Always Dark Sidebar".
            // However, request says "same design as ... LayoutEmpresa". LayoutEmpresa has light sidebar in light mode.
            // I will follow LayoutEmpresa logic: sidebar matches theme.
        }}>
            <Toolbar sx={{
                display: 'flex', alignItems: 'center', px: 2,
                background: darkMode
                    ? 'inherit'
                    : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', // Make it dark header for Sidebar in light mode? Or just match LayoutEmpresa?
                // LayoutEmpresa has a gradient header in sidebar.
            }}>
                <ConfirmationNumberIcon sx={{ mr: 1, color: '#38bdf8' }} />
                <Typography variant="h6" noWrap component="div" fontWeight="bold" sx={{ color: 'white' }}>
                    AURONTEK <span style={{ color: '#38bdf8', fontSize: '0.8em' }}>ADMIN</span>
                </Typography>
            </Toolbar>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            <List sx={{ px: 2 }}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <ListItem
                            key={item.text}
                            disablePadding
                            sx={{ mb: 1 }}
                        >
                            <ListItemButton
                                onClick={() => navigate(item.path)}
                                sx={{
                                    borderRadius: 2,
                                    bgcolor: isActive ? '#38bdf8' : 'transparent',
                                    '&:hover': { bgcolor: isActive ? '#38bdf8' : 'rgba(255,255,255,0.05)' },
                                    // If we are in light mode and sidebar is dark (custom), we need white text.
                                    // If we follow LayoutEmpresa exactly, sidebar is light in light mode.
                                    // I'll stick to a Dark Sidebar style for Admin to distinguish it, 
                                    // OR I should conform to the theme completely?
                                    // "quita de ese lateral el admin general... agrega el mismo diseño que en el de los usuarios de empresas el activo..."
                                    // This implies the HEADER design logic.
                                    // Let's keep the Sidebar mostly as is but clean up the bottom, 
                                    // AND ensure it works with the new ThemeProvider.
                                    // To satisfy "Dark Sidebar" in "Light Mode" (common admin pattern), I'll force dark colors here.
                                    // But to use `LayoutEmpresa` style properly, I should let the theme handle it.
                                    // I'll opt for the *Theme Controlled* sidebar (Light in Light Mode) to be consistent with "mismo diseño".
                                }}
                            >
                                <ListItemIcon sx={{ color: isActive ? 'white' : (darkMode ? '#94a3b8' : '#64748b'), minWidth: 40 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{
                                        fontSize: '0.95rem',
                                        fontWeight: isActive ? 600 : 400,
                                        color: isActive ? 'white' : (darkMode ? '#cbd5e1' : '#1e293b')
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
            {/* REMOVED FOOTER USER INFO */}
        </Box>
    );

    // Explicit override for Sidebar background to match the specific look of Admin if desired,
    // otherwise it uses the Theme's paper color. 
    // I will let it use the Theme's paper color but the original had #1e293b. 
    // To match LayoutEmpresa, it should be light in light mode.

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
                <CssBaseline />
                <AppBar
                    position="fixed"
                    sx={{
                        width: { sm: `calc(100% - ${drawerWidth}px)` },
                        ml: { sm: `${drawerWidth}px` },
                    }}
                >
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2, display: { sm: 'none' } }}
                        >
                            <MenuIcon />
                        </IconButton>

                        <Box sx={{ flexGrow: 1 }} />

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {/* Notifications */}
                            <NotificationBell />

                            {/* User Info (Desktop) */}
                            <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2, color: 'text.primary' }}>
                                    {usuario.nombre || 'Admin'}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.8 }}>
                                    <Chip
                                        label={rolLabel}
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

                            {/* Avatar & Menu */}
                            <Tooltip title="Cuenta">
                                <IconButton
                                    onClick={handleMenu}
                                    sx={{ p: 0.5, border: '2px solid', borderColor: 'divider' }}
                                >
                                    <Avatar
                                        sx={{ width: 32, height: 32, bgcolor: '#cbd5e1' }}
                                        src={usuario.foto || undefined}
                                    >
                                        {usuario.nombre ? usuario.nombre.charAt(0) : 'A'}
                                    </Avatar>
                                </IconButton>
                            </Tooltip>
                        </Box>

                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            keepMounted
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
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
                        >
                            <MenuItem onClick={() => { handleClose(); /* Navigate to profile if exists */ }}>
                                <ListItemIcon><Person fontSize="small" /></ListItemIcon>
                                <Typography variant="body2">{t('profile') || 'Mi Perfil'}</Typography>
                            </MenuItem>
                            <MenuItem onClick={handleToggleDarkMode}>
                                <ListItemIcon>
                                    {darkMode ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
                                </ListItemIcon>
                                <Typography variant="body2">
                                    {darkMode ? (t('light_mode') || 'Modo Claro') : (t('dark_mode') || 'Modo Oscuro')}
                                </Typography>
                            </MenuItem>
                            <MenuItem onClick={() => { toggleLanguage(); }}>
                                <ListItemIcon>
                                    <Translate fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="body2">
                                    {language === 'es' ? 'English' : 'Español'}
                                </Typography>
                            </MenuItem>
                            <MenuItem onClick={handleClose}>
                                <ListItemIcon>
                                    <Help fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="body2">{t('help') || 'Ayuda'}</Typography>
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                                <ListItemIcon><ExitToAppIcon fontSize="small" color="error" /></ListItemIcon>
                                <Typography variant="body2" fontWeight="600">{t('logout') || 'Cerrar Sesión'}</Typography>
                            </MenuItem>
                        </Menu>
                    </Toolbar>
                </AppBar>

                <Box
                    component="nav"
                    sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                >
                    <Drawer
                        variant="temporary"
                        open={mobileOpen}
                        onClose={handleDrawerToggle}
                        ModalProps={{ keepMounted: true }}
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
                            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none' },
                        }}
                        open
                    >
                        {drawer}
                    </Drawer>
                </Box>

                <Box
                    component="main"
                    sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: 8 }}
                >
                    <Outlet />
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default LayoutAdmin;
