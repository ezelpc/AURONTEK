import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserStatus = 'available' | 'busy' | 'offline';
export type Theme = 'light' | 'dark' | 'system';
export type Language = 'es' | 'en';

interface UIState {
    status: UserStatus;
    theme: Theme;
    language: Language;

    setStatus: (status: UserStatus) => void;
    setTheme: (theme: Theme) => void;
    setLanguage: (lang: Language) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            status: 'available',
            theme: 'system',
            language: 'es',

            setStatus: (status) => set({ status }),
            setTheme: (theme) => set({ theme }),
            setLanguage: (language) => set({ language }),
        }),
        {
            name: 'ui-storage',
        }
    )
);
