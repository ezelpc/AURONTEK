import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/auth/auth.store';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Ticket,
    Users,
    Building2,
    ShieldAlert,
    Globe,
    Briefcase,
    ShieldCheck,
    ChevronDown,
    ChevronRight,
    UserCog,
    UsersRound,
    TicketCheck,
    TicketX,
    GlobeLock,
    MapPin
} from 'lucide-react';
import { UserMenu } from '@/components/UserMenu';
import { NotificationsMenu } from '@/components/NotificationsMenu';
import { Toaster } from '@/components/ui/sonner';
import { useTranslation } from 'react-i18next';
import CommandMenu from '@/components/CommandMenu';
import { ProtectedElement } from '@/components/ProtectedElement';
import { socketService } from '@/api/socket.service';
import { toast } from 'sonner';
import { PERMISSIONS } from '@/constants/permissions';

const SidebarItem = ({ to, icon: Icon, label, end = false, collapsed, isSubmenuItem = false }: { to: string, icon: any, label: string, end?: boolean, collapsed?: boolean, isSubmenuItem?: boolean }) => (
    <NavLink
        to={to}
        end={end}
        className={({ isActive }) => cn(
            "flex items-center gap-3 rounded-md transition-all duration-200 text-sm font-medium",
            isActive
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50",
            collapsed && "justify-center px-3 py-2",
            !collapsed && !isSubmenuItem && "px-3 py-2",
            !collapsed && isSubmenuItem && "pl-9 pr-3 py-1.5"
        )}
        title={collapsed ? label : undefined}
    >
        <Icon className="h-4 w-4 flex-shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
);

const SidebarSubmenu = ({
    icon: Icon,
    label,
    collapsed,
    children
}: {
    icon: any,
    label: string,
    collapsed?: boolean,
    children: React.ReactNode
}) => {
    const [isOpen, setIsOpen] = useState(false);

    if (collapsed) {
        return <>{children}</>;
    }

    return (
        <div className="space-y-1">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50"
            >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate flex-1 text-left">{label}</span>
                {isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
                ) : (
                    <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
                )}
            </button>
            {isOpen && (
                <div className="space-y-0.5 pb-1">
                    {children}
                </div>
            )}
        </div>
    );
};

const AdminLayout = () => {
    const { user } = useAuthStore();
    const { t } = useTranslation();
    const [sidebarHovered, setSidebarHovered] = useState(false);

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

    const isCollapsed = !sidebarHovered;

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
            {/* Sidebar */}
            <aside
                className={cn(
                    "bg-slate-950 text-white flex flex-col border-r border-slate-800 transition-all duration-300 ease-in-out",
                    isCollapsed ? "w-16" : "w-64"
                )}
                onMouseEnter={() => setSidebarHovered(true)}
                onMouseLeave={() => setSidebarHovered(false)}
            >
                <div className={cn(
                    "p-4 flex items-center border-b border-slate-800",
                    isCollapsed ? "justify-center" : "gap-2 justify-between"
                )}>
                    {!isCollapsed && (
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="h-6 w-6 text-blue-500" />
                            <span className="font-bold text-lg tracking-tight">Aurontek HQ</span>
                        </div>
                    )}
                    {isCollapsed && <ShieldAlert className="h-6 w-6 text-blue-500" />}
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
                    {/* Dashboard - No permission required */}
                    <SidebarItem to="/admin/dashboard" icon={LayoutDashboard} label={t('dashboard')} end collapsed={isCollapsed} />

                    {/* Usuarios - Submenu with local/global */}
                    <ProtectedElement permission={[PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_VIEW_GLOBAL, PERMISSIONS.ADMINS_MANAGE]}>
                        <SidebarSubmenu icon={Users} label="Usuarios" collapsed={isCollapsed}>
                            <ProtectedElement permission={[PERMISSIONS.USERS_VIEW, PERMISSIONS.ADMINS_MANAGE]}>
                                <SidebarItem to="/admin/usuarios?tipo=local" icon={UserCog} label="Usuarios Locales" collapsed={isCollapsed} isSubmenuItem />
                            </ProtectedElement>
                            <ProtectedElement permission={PERMISSIONS.USERS_VIEW_GLOBAL}>
                                <SidebarItem to="/admin/usuarios?tipo=global" icon={UsersRound} label="Usuarios Globales" collapsed={isCollapsed} isSubmenuItem />
                            </ProtectedElement>
                        </SidebarSubmenu>
                    </ProtectedElement>

                    {/* Tickets - Submenu with local/global */}
                    <ProtectedElement permission={[PERMISSIONS.TICKETS_VIEW_ALL, PERMISSIONS.TICKETS_VIEW_ALL_GLOBAL]}>
                        <SidebarSubmenu icon={Ticket} label="Tickets" collapsed={isCollapsed}>
                            <ProtectedElement permission={PERMISSIONS.TICKETS_VIEW_ALL}>
                                <SidebarItem to="/admin/tickets?tipo=local" icon={TicketCheck} label="Tickets Locales" collapsed={isCollapsed} isSubmenuItem />
                            </ProtectedElement>
                            <ProtectedElement permission={PERMISSIONS.TICKETS_VIEW_ALL_GLOBAL}>
                                <SidebarItem to="/admin/tickets?tipo=global" icon={TicketX} label="Tickets Globales" collapsed={isCollapsed} isSubmenuItem />
                            </ProtectedElement>
                        </SidebarSubmenu>
                    </ProtectedElement>

                    {/* Empresas - Only admin-general */}
                    <ProtectedElement permission={PERMISSIONS.COMPANIES_VIEW_ALL}>
                        <SidebarItem to="/admin/empresas" icon={Building2} label={t('companies')} collapsed={isCollapsed} />
                    </ProtectedElement>

                    {/* Servicios - Submenu with local/global */}
                    <ProtectedElement permission={[PERMISSIONS.SERVICIOS_MANAGE_LOCAL, PERMISSIONS.SERVICIOS_MANAGE_GLOBAL]}>
                        <SidebarSubmenu icon={Globe} label="Servicios" collapsed={isCollapsed}>
                            <ProtectedElement permission={PERMISSIONS.SERVICIOS_MANAGE_LOCAL}>
                                <SidebarItem to="/admin/servicios?tipo=local" icon={MapPin} label="Servicios Locales" collapsed={isCollapsed} isSubmenuItem />
                            </ProtectedElement>
                            <ProtectedElement permission={PERMISSIONS.SERVICIOS_MANAGE_GLOBAL}>
                                <SidebarItem to="/admin/servicios?tipo=global" icon={GlobeLock} label="Servicios Globales" collapsed={isCollapsed} isSubmenuItem />
                            </ProtectedElement>
                        </SidebarSubmenu>
                    </ProtectedElement>

                    {/* Grupos de Atención */}
                    <ProtectedElement permission={PERMISSIONS.HABILITIES_VIEW}>
                        <SidebarItem to="/admin/habilidades" icon={Briefcase} label="Grupos de Atención" collapsed={isCollapsed} />
                    </ProtectedElement>

                    {/* Sistema - Submenu with Roles and Admins */}
                    <ProtectedElement permission={[PERMISSIONS.ROLES_VIEW, PERMISSIONS.ADMINS_MANAGE]}>
                        <SidebarSubmenu icon={ShieldCheck} label="Sistema" collapsed={isCollapsed}>
                            <ProtectedElement permission={PERMISSIONS.ROLES_VIEW}>
                                <SidebarItem to="/admin/roles" icon={ShieldCheck} label={t('roles')} collapsed={isCollapsed} isSubmenuItem />
                            </ProtectedElement>
                            <ProtectedElement permission={PERMISSIONS.ADMINS_MANAGE}>
                                <SidebarItem to="/admin/system-admins" icon={ShieldAlert} label={t('admins')} collapsed={isCollapsed} isSubmenuItem />
                            </ProtectedElement>
                        </SidebarSubmenu>
                    </ProtectedElement>
                </nav>

                <div className={cn(
                    "border-t border-slate-800 flex",
                    isCollapsed
                        ? "flex-col items-center gap-4 py-4 px-2"
                        : "items-center justify-between p-4"
                )}>
                    <div className={isCollapsed ? "w-full flex justify-center" : ""}>
                        <UserMenu compact={isCollapsed} />
                    </div>
                    <div className={isCollapsed ? "w-full flex justify-center" : ""}>
                        <NotificationsMenu />
                    </div>
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
