import { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/auth/auth.store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    Ticket,
    Users,
    Building2,
    ShieldCheck
} from 'lucide-react';
import { UserMenu } from '@/components/UserMenu';
import { NotificationsMenu } from '@/components/NotificationsMenu';
import { Toaster } from '@/components/ui/sonner';
import { useTranslation } from 'react-i18next';
import CommandMenu from '@/components/CommandMenu';
import { ProtectedElement } from '@/components/ProtectedElement';
import { socketService } from '@/api/socket.service';
import { toast } from 'sonner';

const SidebarItem = ({ to, icon: Icon, label, end = false }: { to: string, icon: any, label: string, end?: boolean }) => (
    <NavLink
        to={to}
        end={end}
        className={({ isActive }) => cn(
            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
            isActive
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
        )}
    >
        <Icon className="h-4 w-4" />
        {label}
    </NavLink>
);

const AdminLayout = () => {
    const { user } = useAuthStore();
    const { t } = useTranslation();

    // Efecto para conectar socket y escuchar notificaciones
    useEffect(() => {
        socketService.connect();

        // Escuchar notificaciones generales
        socketService.on('notificacion', (payload: any) => {
            // Payload esperado: { titulo, mensaje, tipo }
            toast(payload.titulo || 'Notificación', {
                description: payload.mensaje,
                action: {
                    label: 'Ver',
                    onClick: () => console.log('Navegar a...', payload), // TODO: Navegar si hay linkId
                },
            });
        });

        return () => {
            socketService.disconnect();
        };
    }, []);


    if (!user) return null; // Or redirect

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-950 text-white flex flex-col border-r border-slate-800">
                <div className="p-6 flex items-center gap-2 border-b border-slate-800 justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="h-6 w-6 text-blue-500" />
                        <span className="font-bold text-lg tracking-tight">Aurontek HQ</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <SidebarItem to="/admin/dashboard" icon={LayoutDashboard} label={t('dashboard')} end />

                    <ProtectedElement permission="tickets.view_all_global">
                        <SidebarItem to="/admin/tickets" icon={Ticket} label={t('tickets')} />
                    </ProtectedElement>

                    <ProtectedElement permission="users.view_all_global">
                        <SidebarItem to="/admin/usuarios" icon={Users} label={t('users')} />
                    </ProtectedElement>

                    <ProtectedElement permission="companies.view_all">
                        <SidebarItem to="/admin/empresas" icon={Building2} label={t('companies')} />
                    </ProtectedElement>

                    <ProtectedElement permission="servicios.manage_local">
                        <SidebarItem to="/admin/servicios" icon={Globe} label={t('services')} />
                    </ProtectedElement>

                    <ProtectedElement permission="habilities.view">
                        <SidebarItem to="/admin/habilidades" icon={Briefcase} label="Grupos de Atención" />
                    </ProtectedElement>

                    <ProtectedElement permission="roles.view">
                        <SidebarItem to="/admin/roles" icon={ShieldCheck} label={t('roles')} />
                    </ProtectedElement>

                    <ProtectedElement permission="admins.manage">
                        <SidebarItem to="/admin/system-admins" icon={ShieldCheck} label={t('admins')} />
                    </ProtectedElement>
                </nav>

                <div className="p-4 border-t border-slate-800 flex items-center justify-between">
                    <UserMenu />
                    <NotificationsMenu />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="h-full p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>

            <CommandMenu />
            <Toaster />
        </div>
    );
};

export default AdminLayout;
