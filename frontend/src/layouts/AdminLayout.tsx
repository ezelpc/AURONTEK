import { useEffect, useState, createContext, useContext } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/auth/auth.store';
import { usePermissionRefresh } from '@/hooks/usePermissionRefresh';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { GlobalChat } from '@/components/GlobalChat';

// Context to manage sidebar state
const SidebarContext = createContext({ collapsed: false });

const SidebarItem = ({ to, icon: Icon, label, end = false, isSubmenuItem = false }: { to: string, icon: any, label: string, end?: boolean, isSubmenuItem?: boolean }) => {
    const { collapsed } = useContext(SidebarContext);

    return (
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
};

interface SidebarSubmenuProps {
    icon: any;
    label: string;
    children: React.ReactNode;
    isActive?: boolean;
}

const SidebarSubmenu = ({
    icon: Icon,
    label,
    children,
    isActive
}: SidebarSubmenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const { collapsed } = useContext(SidebarContext);

    // Auto-open if active and not collapsed
    useEffect(() => {
        if (!collapsed && isActive) {
            setIsOpen(true);
        }
    }, [collapsed, isActive]);

    if (collapsed) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        className={cn(
                            "w-full flex justify-center px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium",
                            isActive
                                ? "bg-slate-800 text-white"
                                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                        )}
                        title={label}
                    >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="w-56 ml-2 bg-slate-950 border-slate-800 text-slate-400">
                    <DropdownMenuLabel className="text-white px-2 py-1.5">{label}</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-800" />
                    <div className="flex flex-col gap-1 p-1">
                        <SidebarContext.Provider value={{ collapsed: false }}>
                            {/* We need to ensure children are rendered with collapsed=false context */}
                            {children}
                        </SidebarContext.Provider>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <div className="space-y-1">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 text-sm font-medium",
                    isActive && !isOpen ? "text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
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
    const location = useLocation();

    // Auto-refresh permisos cada 5 minutos
    usePermissionRefresh(5);

    // Efecto para conectar sockets y escuchar notificaciones
    useEffect(() => {
        try {
            // Conectar ambos sockets
            socketService.connectChat();
            socketService.connectNotifications();

            // Escuchar notificaciones en tiempo real
            socketService.onNewNotification((notification: any) => {
                toast(notification.titulo || 'Notificación', {
                    description: notification.mensaje,
                    action: notification.metadata?.ticketId ? {
                        label: 'Ver',
                        onClick: () => window.location.href = `/admin/tickets/${notification.metadata.ticketId}`
                    } : undefined,
                });
            });
        } catch (error) {
            console.error('Error conectando sockets:', error);
        }

        return () => {
            try {
                socketService.disconnect();
            } catch (error) {
                console.error('Error desconectando sockets:', error);
            }
        };
    }, []);


    if (!user) return null; // Or redirect

    const isCollapsed = !sidebarHovered;

    // Helper to check active state for submenus
    const isUsersActive = location.pathname.startsWith('/admin/usuarios');
    const isTicketsActive = location.pathname.startsWith('/admin/tickets');
    const isServicesActive = location.pathname.startsWith('/admin/servicios');
    const isSystemActive = location.pathname.startsWith('/admin/roles') || location.pathname.startsWith('/admin/system-admins');

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
            {/* Sidebar */}
            <aside
                className={cn(
                    "bg-slate-950 text-white flex flex-col border-r border-slate-800 transition-all duration-300 ease-in-out relative z-50",
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

                <SidebarContext.Provider value={{ collapsed: isCollapsed }}>
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
                        {/* Dashboard - No permission required */}
                        <SidebarItem to="/admin/dashboard" icon={LayoutDashboard} label={t('common.nav.dashboard')} end />

                        {/* Usuarios - Submenu with local/global */}
                        <ProtectedElement permission={[PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_VIEW_GLOBAL, PERMISSIONS.ADMINS_MANAGE]}>
                            <SidebarSubmenu icon={Users} label={t('common.nav.users')} isActive={isUsersActive}>
                                <ProtectedElement permission={[PERMISSIONS.USERS_VIEW, PERMISSIONS.ADMINS_MANAGE]}>
                                    <SidebarItem to="/admin/usuarios?tipo=local" icon={UserCog} label={t('common.nav.users_local')} isSubmenuItem />
                                </ProtectedElement>
                                <ProtectedElement permission={PERMISSIONS.USERS_VIEW_GLOBAL}>
                                    <SidebarItem to="/admin/usuarios?tipo=global" icon={UsersRound} label={t('common.nav.users_global')} isSubmenuItem />
                                </ProtectedElement>
                            </SidebarSubmenu>
                        </ProtectedElement>

                        {/* Tickets - Submenu with local/global */}
                        <ProtectedElement permission={[PERMISSIONS.TICKETS_VIEW_ALL, PERMISSIONS.TICKETS_VIEW_ALL_GLOBAL]}>
                            <SidebarSubmenu icon={Ticket} label={t('common.nav.tickets')} isActive={isTicketsActive}>
                                <ProtectedElement permission={PERMISSIONS.TICKETS_VIEW_ALL}>
                                    <SidebarItem to="/admin/tickets?tipo=local" icon={TicketCheck} label={t('common.nav.tickets_local')} isSubmenuItem />
                                </ProtectedElement>
                                <ProtectedElement permission={PERMISSIONS.TICKETS_VIEW_ALL_GLOBAL}>
                                    <SidebarItem to="/admin/tickets?tipo=global" icon={TicketX} label={t('common.nav.tickets_global')} isSubmenuItem />
                                </ProtectedElement>
                            </SidebarSubmenu>
                        </ProtectedElement>

                        {/* Empresas - Only admin-general */}
                        <ProtectedElement permission={PERMISSIONS.COMPANIES_VIEW_ALL}>
                            <SidebarItem to="/admin/empresas" icon={Building2} label={t('common.nav.companies')} />
                        </ProtectedElement>

                        {/* Servicios - Submenu with local/global */}
                        <ProtectedElement permission={[PERMISSIONS.SERVICIOS_VIEW_LOCAL, PERMISSIONS.SERVICIOS_VIEW_GLOBAL]}>
                            <SidebarSubmenu icon={Globe} label={t('common.nav.services')} isActive={isServicesActive}>
                                <ProtectedElement permission={PERMISSIONS.SERVICIOS_VIEW_LOCAL}>
                                    <SidebarItem to="/admin/servicios?tipo=local" icon={MapPin} label={t('common.nav.services_local')} isSubmenuItem />
                                </ProtectedElement>
                                <ProtectedElement permission={PERMISSIONS.SERVICIOS_VIEW_GLOBAL}>
                                    <SidebarItem to="/admin/servicios?tipo=global" icon={GlobeLock} label={t('common.nav.services_global')} isSubmenuItem />
                                </ProtectedElement>
                            </SidebarSubmenu>
                        </ProtectedElement>

                        {/* Grupos de Atención */}
                        <ProtectedElement permission={PERMISSIONS.HABILITIES_VIEW}>
                            <SidebarItem to="/admin/habilidades" icon={Briefcase} label={t('common.nav.care_groups')} />
                        </ProtectedElement>

                        {/* Sistema - Submenu with Roles and Admins */}
                        <ProtectedElement permission={[PERMISSIONS.ROLES_VIEW, PERMISSIONS.ADMINS_MANAGE]}>
                            <SidebarSubmenu icon={ShieldCheck} label={t('common.nav.system')} isActive={isSystemActive}>
                                <ProtectedElement permission={PERMISSIONS.ROLES_VIEW}>
                                    <SidebarItem to="/admin/roles" icon={ShieldCheck} label={t('common.nav.roles')} isSubmenuItem />
                                </ProtectedElement>
                                <ProtectedElement permission={PERMISSIONS.ADMINS_MANAGE}>
                                    <SidebarItem to="/admin/system-admins" icon={ShieldAlert} label={t('common.nav.admins')} isSubmenuItem />
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
                </SidebarContext.Provider>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                <div className="p-6">
                    <Outlet />
                </div>
            </main>

            <CommandMenu />
            <GlobalChat />
            <Toaster />
        </div>
    );
};

export default AdminLayout;
