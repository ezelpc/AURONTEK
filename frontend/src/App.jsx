import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// --- CONTEXTS ---
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LanguageProvider } from './contexts/LanguageContext';

// --- LAYOUTS ---
import MainLayout from './components/layout/MainLayout';
import LayoutEmpresa from './components/layout/LayoutEmpresa';
import LayoutAdmin from './components/layout/LayoutAdmin';

// --- PAGES ADMIN SISTEMA ---
import LoginAdmin from './pages/admin/LoginAdmin';
import EmpresasAdmin from './pages/admin/EmpresasAdmin';
import GestionTicketsGlobal from './pages/admin/GestionTicketsGlobal';
import Dashboard from './pages/Dashboard';
import RegistrarEmpresa from './pages/RegistrarEmpresa';
import Tickets from './pages/Tickets';
import CrearTicket from './pages/CrearTicket';
import Usuarios from './pages/Usuarios';
import RolesAdmin from './pages/admin/RolesAdmin'; // NEW
import Perfil from './pages/Perfil';
import TicketDetailPage from './pages/TicketDetailPage';
import NotificacionesPage from './pages/NotificacionesPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Servicios from './pages/Servicios';

// --- PAGES EMPRESA ---
import ValidarAcceso from './pages/ValidarAcceso';
import LoginEmpresa from './pages/LoginEmpresa';
import DashboardEmpresa from './pages/empresa/DashboardEmpresa';
import UsuariosEmpresa from './pages/empresa/UsuariosEmpresa';
import TicketsEmpresa from './pages/empresa/TicketsEmpresa';
import CrearTicketEmpresa from './pages/empresa/CrearTicketEmpresa';

// --- COMPONENTS ---
import IAAssistant from './components/ia/IAAssistant';

// --- UTILIDADES ---
import PrivateRoute from './components/PrivateRoute';
import NotFound from './pages/NotFound';
import ErrorBoundary from './ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <LanguageProvider>
          <NotificationProvider>
            <SocketProvider>
              <Routes>
                {/* ================= RUTAS PÚBLICAS ================= */}
                <Route path="/login" element={<Navigate to="/acceso-empresa" replace />} />

                {/* Flujo de Acceso Empresa */}
                <Route path="/acceso-empresa" element={<ValidarAcceso />} />
                <Route path="/empresa/login" element={<LoginEmpresa />} />

                {/* Recuperación de Contraseña */}
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />

                {/* ================= RUTA ADMIN SISTEMA (INDEPENDIENTE) ================= */}
                <Route path="/admin/login" element={<LoginAdmin />} />

                <Route path="/admin" element={
                  <PrivateRoute allowedRoles={['admin-general', 'admin-subroot']}>
                    <LayoutAdmin />
                  </PrivateRoute>
                }>
                  <Route index element={<Navigate to="dashboard" />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="empresas" element={<EmpresasAdmin />} />
                  <Route path="empresas/nueva" element={<RegistrarEmpresa />} />
                  <Route path="gestion-tickets" element={<GestionTicketsGlobal />} />
                  <Route path="tickets" element={<Tickets />} />
                  <Route path="tickets/nuevo" element={<CrearTicket />} /> {/* Admin Creating Ticket? Maybe needed */}
                  <Route path="tickets/:id" element={<TicketDetailPage />} />
                  <Route path="usuarios" element={<Usuarios />} />
                  <Route path="roles" element={<RolesAdmin />} /> {/* NEW: RBAC Page */}
                  <Route path="notificaciones" element={<NotificacionesPage />} />
                  <Route path="perfil" element={<Perfil />} />
                  <Route path="servicios" element={<Servicios />} />
                </Route>

                {/* Legacy Root Redirect - Now SuperAdmin must go to /admin/login explicitly? 
                    Or redirect / to /admin/login? 
                    User said 'enlace por correo... redirigir a acceso empresa'. 
                    So root '/' should probably go to '/acceso-empresa'.
                */}
                <Route path="/" element={<Navigate to="/acceso-empresa" replace />} />

                {/* ================= RUTA ADMIN EMPRESA (CLIENTE) ================= */}
                <Route path="/empresa" element={
                  <PrivateRoute allowedRoles={[
                    'admin-interno', 'soporte', 'usuario', 'beca-soporte',
                    'soporte-plataforma', 'resolutor-interno', 'resolutor-empresa',
                    'cliente-final', 'becario'
                  ]}>
                    <LayoutEmpresa />
                  </PrivateRoute>
                }>
                  <Route index element={<Navigate to="dashboard" />} />
                  <Route path="dashboard" element={<DashboardEmpresa />} />

                  <Route path="usuarios" element={
                    <PrivateRoute allowedRoles={['admin-interno']}>
                      <UsuariosEmpresa />
                    </PrivateRoute>
                  } />

                  <Route path="tickets" element={<TicketsEmpresa />} />
                  <Route path="tickets/nuevo" element={<CrearTicketEmpresa />} />
                  <Route path="tickets/:id" element={<TicketDetailPage />} />
                  <Route path="notificaciones" element={<NotificacionesPage />} />
                  <Route path="perfil" element={<Perfil />} />
                  <Route path="servicios" element={<Servicios />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/acceso-empresa" replace />} />
              </Routes>

              {/* Asistente IA flotante */}
              <IAAssistant />
            </SocketProvider>
          </NotificationProvider>
        </LanguageProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;