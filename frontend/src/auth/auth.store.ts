import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types/api.types';
import { useUIStore } from '@/components/ui.store';

interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;

    // Actions
    setToken: (token: string) => void;
    setUser: (user: User) => void;
    login: (token: string, user: User) => void;
    logout: () => void;
    refreshPermissions: () => Promise<void>;

    // Permission Helper
    hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            isAuthenticated: false,

            setToken: (token) => set({ token, isAuthenticated: !!token }),
            setUser: (user) => set({ user }),

            login: (token, user) => {
                set({ token, user, isAuthenticated: true });

                // Siempre establecer estado como "disponible" al iniciar sesión
                useUIStore.getState().setStatus('available');

                // Sincronizar con el backend (enviar actualización de estado)
                // Esto se hace de forma asíncrona sin bloquear el login
                import('@/auth/auth.service').then(({ authService }) => {
                    authService.updateStatus('available').catch(err =>
                        console.error('Error al actualizar estado en backend:', err)
                    );
                });
            },

            logout: () => {
                set({ token: null, user: null, isAuthenticated: false });
                // Automatically set status to offline (gray)
                useUIStore.getState().setStatus('offline');
            },

            refreshPermissions: async () => {
                try {
                    const { authService } = await import('@/auth/auth.service');
                    const data = await authService.refreshPermissions();

                    // Actualizar solo permisos del usuario
                    const currentUser = get().user;
                    if (currentUser) {
                        set({
                            user: {
                                ...currentUser,
                                permisos: data.permisos,
                                rol: data.rol
                            }
                        });
                        console.log('✅ Permisos actualizados:', data.permisos);
                    }
                } catch (error) {
                    console.error('Error refreshing permissions:', error);
                }
            },

            hasPermission: (permission: string) => {
                const user = get().user;
                if (!user) return false;

                if (user.permisos?.includes('*')) return true;
                return user.permisos?.includes(permission);
            }
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);
