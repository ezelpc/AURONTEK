import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// --- CONTEXTS ---
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';

// --- LAYOUTS ---
import MainLayout from './components/layout/MainLayout';
import LayoutEmpresa from './components/layout/LayoutEmpresa';

// --- PAGES ADMIN SISTEMA ---
import Dashboard from './pages/Dashboard';
import RegistrarEmpresa from './pages/RegistrarEmpresa';
import Tickets from './pages/Tickets';
import CrearTicket from './pages/CrearTicket';
import Usuarios from './pages/Usuarios';
import Perfil from './pages/Perfil';
import TicketDetailPage from './pages/TicketDetailPage';
import NotificacionesPage from './pages/NotificacionesPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

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
              
              {/* ================= RUTA ADMIN SISTEMA (SUPERADMIN) ================= */}
              <Route path="/" element={
                <PrivateRoute allowedRoles={['Admin', 'superadmin']}>
                  <MainLayout />
                </PrivateRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="registrar-empresa" element={<RegistrarEmpresa />} />
                <Route path="tickets" element={<Tickets />} />
                <Route path="tickets/nuevo" element={<CrearTicket />} />
                <Route path="tickets/:id" element={<TicketDetailPage />} />
                <Route path="usuarios" element={<Usuarios />} />
                <Route path="notificaciones" element={<NotificacionesPage />} />
                <Route path="perfil" element={<Perfil />} />
              </Route>

              {/* ================= RUTA ADMIN EMPRESA (CLIENTE) ================= */}
              <Route path="/empresa" element={
                <PrivateRoute allowedRoles={['admin-interno', 'admin_empresa', 'soporte', 'usuario_final', 'becario', 'beca-soporte']}>
                  <LayoutEmpresa />
                </PrivateRoute>
              }>
                <Route index element={<Navigate to="dashboard" />} />
                <Route path="dashboard" element={<DashboardEmpresa />} />
                
                <Route path="usuarios" element={
                  <PrivateRoute allowedRoles={['admin_empresa']}>
                    <UsuariosEmpresa />
                  </PrivateRoute>
                } />
                
                <Route path="tickets" element={<TicketsEmpresa />} />
                <Route path="tickets/nuevo" element={<CrearTicketEmpresa />} />
                <Route path="tickets/:id" element={<TicketDetailPage />} />
                <Route path="notificaciones" element={<NotificacionesPage />} />
                <Route path="perfil" element={<Perfil />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/acceso-empresa" replace />} />
            </Routes>
            
            {/* Asistente IA flotante */}
            <IAAssistant />
          </SocketProvider>
        </NotificationProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;