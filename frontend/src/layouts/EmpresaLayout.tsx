import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/auth/auth.store';
import { cn } from '@/lib/utils';
import { LayoutDashboard, PlusCircle, Building2, Users, Globe, ShieldCheck } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { ProtectedElement } from '@/components/ProtectedElement';
import { UserMenu } from '@/components/UserMenu';
import { useTranslation } from 'react-i18next';

const NavbarItem = ({ to, icon: Icon, label, end = false }: { to: string, icon: any, label: string, end?: boolean }) => (
    <NavLink
        to={to}
        end={end}
        className={({ isActive }) => cn(
            "flex items-center gap-2 px-4 py-2 rounded-full transition-colors text-sm font-medium",
            isActive
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        )}
    >
        <Icon className="h-4 w-4" />
        {label}
    </NavLink>
);

const EmpresaLayout = () => {
    const { user } = useAuthStore();
    const { t } = useTranslation();

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-30 w-full border-b bg-white/80 backdrop-blur dark:bg-slate-950/80 dark:border-slate-800">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                        <Building2 className="h-6 w-6 text-blue-600" />
                        <span>Aurontek <span className="text-slate-400 font-normal">Portal</span></span>
                    </div>

                    <nav className="hidden md:flex items-center gap-2">
                        <NavbarItem to="/empresa/dashboard" icon={LayoutDashboard} label={t('dashboard')} end />
                        <NavbarItem to="/empresa/nuevo-ticket" icon={PlusCircle} label="Reportar" />

                        <ProtectedElement permission="users.view">
                            <NavbarItem to="/empresa/equipo" icon={Users} label={t('my_team')} />
                        </ProtectedElement>

                        <ProtectedElement permission="servicios.manage_local">
                            <NavbarItem to="/empresa/servicios" icon={Globe} label={t('services')} />
                        </ProtectedElement>

                        <ProtectedElement permission="roles.view">
                            <NavbarItem to="/empresa/roles" icon={ShieldCheck} label={t('roles')} />
                        </ProtectedElement>
                    </nav>

                    <div className="flex items-center gap-4">
                        <UserMenu />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
                <Outlet />
            </main>

            <Toaster />
        </div>
    );
};

export default EmpresaLayout;
