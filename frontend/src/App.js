import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// --- LAYOUTS ---
import MainLayout from './components/layout/MainLayout';         // Admin Sistema
import LayoutEmpresa from './components/layout/LayoutEmpresa';   // Admin Empresa

// --- PAGES ADMIN SISTEMA ---
// import LoginAdmin from './pages/Login-admin.pages'; // ELIMINADO TEMPORALMENTE
import Dashboard from './pages/Dashboard';
import RegistrarEmpresa from './pages/RegistrarEmpresa';
import Tickets from './pages/Tickets';
import CrearTicket from './pages/CrearTicket';
import Usuarios from './pages/Usuarios';
import Perfil from './pages/Perfil';

// --- PAGES EMPRESA ---
import ValidarAcceso from './pages/ValidarAcceso';
import LoginEmpresa from './pages/LoginEmpresa';
import DashboardEmpresa from './pages/empresa/DashboardEmpresa';
import UsuariosEmpresa from './pages/empresa/UsuariosEmpresa';
import TicketsEmpresa from './pages/empresa/TicketsEmpresa';
import CrearTicketEmpresa from './pages/empresa/CrearTicketEmpresa';

// --- UTILIDADES ---
import PrivateRoute from './components/PrivateRoute';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= RUTAS PÚBLICAS ================= */}
        
        {/* 1. Redirección Clave:
           Como PrivateRoute redirige a "/login" si no hay sesión, 
           esta línea atrapa ese intento y lo manda a tu nueva portada "/acceso-empresa".
        */}
        <Route path="/login" element={<Navigate to="/acceso-empresa" replace />} />
        
        {/* Flujo de Acceso Empresa (Nueva Portada) */}
        <Route path="/acceso-empresa" element={<ValidarAcceso />} />
        <Route path="/empresa/login" element={<LoginEmpresa />} />
        
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
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="perfil" element={<Perfil />} />
        </Route>

        {/* ================= RUTA ADMIN EMPRESA (CLIENTE) ================= */}
        <Route path="/empresa" element={
          <PrivateRoute allowedRoles={['admin_empresa', 'soporte', 'usuario_final', 'becario']}>
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
          
          <Route path="perfil" element={<Perfil />} />
        </Route>

        {/* Fallback: Cualquier ruta desconocida va al inicio del flujo de empresa */}
        <Route path="*" element={<Navigate to="/acceso-empresa" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;