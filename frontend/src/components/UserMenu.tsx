import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from '@/auth/auth.store';
import { useUIStore } from '@/components/ui.store';
import { LogOut, Sun, Moon, Laptop, Globe, User as UserIcon, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/auth/auth.service';
import { useTranslation } from 'react-i18next';

export function UserMenu({ compact = false }: { compact?: boolean }) {
    const { user, logout } = useAuthStore();
    const { status, setStatus, theme, setTheme, language, setLanguage } = useUIStore();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleLogout = async () => {
        try {
            // 1. Determinar ruta de redirección ANTES de hacer logout
            const isAdmin = user?.rol?.startsWith('admin');
            const redirectPath = isAdmin ? '/admin/login' : '/acceso-empresa';

            // 2. Actualizar estado a offline (con timeout para no bloquear)
            setStatus('offline');

            // Intentar actualizar en backend con timeout de 1 segundo
            const updatePromise = authService.updateStatus('offline');
            const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1000));
            await Promise.race([updatePromise, timeoutPromise]).catch(() => {
                console.log('Status update timed out or failed, continuing with logout');
            });

            // 3. Ejecutar logout (limpia token, user, isAuthenticated)
            logout();

            // 4. Limpiar cualquier dato residual del localStorage
            localStorage.removeItem('companyAccessCode');
            localStorage.removeItem('rememberedUser');

            // 5. Navegar a la página de login correspondiente
            navigate(redirectPath, { replace: true });
        } catch (error) {
            console.error('Error during logout:', error);
            // Asegurar que el logout se complete incluso si hay errores
            logout();
            navigate('/admin/login', { replace: true });
        }
    };

    const changeStatus = (newStatus: 'available' | 'busy') => {
        setStatus(newStatus);
        authService.updateStatus(newStatus).catch(err => console.error("Failed to update status", err));
    };

    // Helper for Status Color
    const getStatusColor = (s: string) => {
        switch (s) {
            case 'available': return 'bg-green-500';
            case 'busy': return 'bg-red-500';
            case 'offline': return 'bg-slate-400';
            default: return 'bg-slate-400';
        }
    };

    if (!user) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="relative">
                        <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {user.nombre.charAt(0).toUpperCase()}
                        </div>
                        {/* Status Indicator Dot */}
                        <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-slate-950 ${getStatusColor(status)}`} />
                    </div>
                    {!compact && (
                        <div className="hidden sm:block text-left">
                            <div className="text-sm font-medium text-slate-900 dark:text-white leading-none mb-1">{user.nombre}</div>
                            <div className="text-xs text-slate-500 uppercase">{user.rol}</div>
                        </div>
                    )}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.nombre}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <UserIcon className="mr-2 h-4 w-4" />
                            <span>{t('status')}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => changeStatus('available')}>
                                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                                    <span>{t('available')}</span>
                                    {status === 'available' && <Check className="ml-auto h-4 w-4" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => changeStatus('busy')}>
                                    <div className="h-2 w-2 rounded-full bg-red-500 mr-2" />
                                    <span>{t('busy')}</span>
                                    {status === 'busy' && <Check className="ml-auto h-4 w-4" />}
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            {theme === 'light' ? <Sun className="mr-2 h-4 w-4" /> : theme === 'dark' ? <Moon className="mr-2 h-4 w-4" /> : <Laptop className="mr-2 h-4 w-4" />}
                            <span>{t('theme')}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => setTheme('light')}>
                                    <Sun className="mr-2 h-4 w-4" />
                                    <span>{t('light')}</span>
                                    {theme === 'light' && <Check className="ml-auto h-4 w-4" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme('dark')}>
                                    <Moon className="mr-2 h-4 w-4" />
                                    <span>{t('dark')}</span>
                                    {theme === 'dark' && <Check className="ml-auto h-4 w-4" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme('system')}>
                                    <Laptop className="mr-2 h-4 w-4" />
                                    <span>{t('system')}</span>
                                    {theme === 'system' && <Check className="ml-auto h-4 w-4" />}
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <Globe className="mr-2 h-4 w-4" />
                            <span>{t('language')}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => setLanguage('es')}>
                                    <span>Español</span>
                                    {language === 'es' && <Check className="ml-auto h-4 w-4" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLanguage('en')}>
                                    <span>English</span>
                                    {language === 'en' && <Check className="ml-auto h-4 w-4" />}
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-900/20">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('logout')}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
