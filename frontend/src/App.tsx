import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { FloatingChatContainer } from '@/components/chat/FloatingChatContainer';
import { useUIStore } from '@/components/ui.store';
import LoginAdmin from '@/pages/admin/LoginAdmin';
import ValidarAcceso from '@/pages/empresa/ValidarAcceso';
import LoginEmpresa from '@/pages/empresa/LoginEmpresa';
import AdminLayout from '@/layouts/AdminLayout';
import TicketsPage from '@/pages/admin/tickets/TicketsPage';
import AdminCreateTicket from '@/pages/admin/tickets/AdminCreateTicket';
import TicketDetail from '@/pages/admin/tickets/TicketDetail';

import AdminDashboard from '@/pages/admin/dashboard/AdminDashboard';
import { RequireAuth, RequirePermission } from '@/auth/RequireAuth';
import EmpresaLayout from '@/layouts/EmpresaLayout';
import EmpresaDashboard from '@/pages/empresa/EmpresaDashboard';
import CreateTicket from '@/pages/empresa/CreateTicket';
import CompanyUsersPage from '@/pages/empresa/users/CompanyUsersPage';
import CompanyServicesPage from '@/pages/empresa/services/CompanyServicesPage';
import UsersPage from '@/pages/admin/users/UsersPage';
import CompaniesPage from '@/pages/admin/companies/CompaniesPage';
import ServicesPage from '@/pages/admin/services/ServicesPage';
import CareGroupsPage from '@/pages/admin/care-groups/CareGroupsPage';
import RolesPage from '@/pages/admin/roles/RolesPage';
import SystemAdminsPage from '@/pages/admin/system/SystemAdminsPage';

function App() {
    const { theme } = useUIStore();

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.add(systemTheme);

            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => {
                root.classList.remove('light', 'dark');
                root.classList.add(mediaQuery.matches ? 'dark' : 'light');
            };
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else {
            root.classList.add(theme);
        }
    }, [theme]);

    return (
        <BrowserRouter>
            <Routes>
                {/* --- Rutas Públicas --- */}
                <Route path="/" element={<Navigate to="/acceso-empresa" replace />} />

                {/* Flujo Empresa */}
                <Route path="/acceso-empresa" element={<ValidarAcceso />} />
                <Route path="/empresa/login" element={<LoginEmpresa />} />

                {/* Flujo Empresa (Protegido por RequireAuth también, aunque con backend checks) */}
                <Route element={<RequireAuth />}>
                    <Route path="/empresa" element={<EmpresaLayout />}>
                        <Route index element={<Navigate to="dashboard" />} />
                        <Route path="dashboard" element={<EmpresaDashboard />} />
                        <Route path="nuevo-ticket" element={<CreateTicket />} />
                        {/* <Route path="tickets/:id" element={<TicketDetail />} /> */}
                        <Route path="equipo" element={<CompanyUsersPage />} />
                        <Route path="servicios" element={<CompanyServicesPage />} />
                        <Route path="roles" element={<RolesPage />} />
                    </Route>
                </Route>

                {/* Flujo Admin */}
                <Route path="/admin/login" element={<LoginAdmin />} />

                {/* --- Rutas Privadas Admin (Protegidas) --- */}
                <Route element={<RequireAuth />}>
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<Navigate to="dashboard" />} />
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="tickets" element={<TicketsPage />} />
                        <Route path="crear-ticket" element={<AdminCreateTicket />} />
                        <Route path="tickets/:id" element={<TicketDetail />} />
                        <Route path="empresas" element={<CompaniesPage />} />

                        {/* Ruta protegida por permiso especifico */}
                        <Route element={<RequirePermission permission="users.view_all_global" />}>
                            <Route path="usuarios" element={<UsersPage />} />
                        </Route>

                        <Route path="servicios" element={<ServicesPage />} />
                        <Route path="habilidades" element={<CareGroupsPage />} />
                        <Route path="roles" element={<RolesPage />} />

                        <Route element={<RequirePermission permission="admins.manage" />}>
                            <Route path="system-admins" element={<SystemAdminsPage />} />
                        </Route>
                    </Route>
                </Route>

                {/* 404 */}
                <Route path="*" element={<div className="h-screen flex items-center justify-center">404 - Not Found</div>} />
            </Routes>
            <FloatingChatContainer />
        </BrowserRouter>
    );
}

export default App;
