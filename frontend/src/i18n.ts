import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useUIStore } from '@/components/ui.store';

// Basic translations
const resources = {
    en: {
        translation: {
            "dashboard": "Dashboard",
            "tickets": "Tickets",
            "users": "Users",
            "companies": "Companies",
            "services": "Services",
            "skills": "Skills",
            "admins": "System Admins",
            "roles": "Roles",
            "logout": "Logout",
            "status": "Status",
            "available": "Available",
            "busy": "In Meeting",
            "offline": "Offline",
            "theme": "Theme",
            "language": "Language",
            "light": "Light",
            "dark": "Dark",
            "system": "System",
            "user_management": "User Management",
            "new_user": "New User",
            "all_companies": "All Companies",
            "global_directory": "Global Directory",
            "name_email": "Name / Email",
            "company": "Company",
            "role_position": "Role / Position",
            "actions": "Actions",
            "my_team": "My Team",
            "team_directory": "Team Directory",
            "create_user": "Create User",
            "cancel": "Cancel",
            "active": "Active",
            "inactive": "Inactive",
            "loading": "Loading...",
            "no_users": "No users found."
        }
    },
    es: {
        translation: {
            "dashboard": "Tablero",
            "tickets": "Gestión Tickets",
            "users": "Usuarios",
            "companies": "Empresas",
            "services": "Servicios",
            "skills": "Habilidades",
            "admins": "Admins Sistema",
            "roles": "Roles",
            "logout": "Cerrar Sesión",
            "status": "Estado",
            "available": "Disponible",
            "busy": "En Junta",
            "offline": "No Disponible",
            "theme": "Tema",
            "language": "Idioma",
            "light": "Claro",
            "dark": "Oscuro",
            "system": "Sistema",
            "user_management": "Gestión de Usuarios",
            "new_user": "Nuevo Usuario",
            "all_companies": "Todas las Empresas",
            "global_directory": "Directorio Global",
            "name_email": "Nombre / Email",
            "company": "Empresa",
            "role_position": "Rol / Puesto",
            "actions": "Acciones",
            "my_team": "Mi Equipo",
            "team_directory": "Directorio de Equipo",
            "create_user": "Crear Usuario",
            "cancel": "Cancelar",
            "active": "Activo",
            "inactive": "Inactivo",
            "loading": "Cargando...",
            "no_users": "No se encontraron usuarios."
        }
    }
};

// Get initial language from store (localStorage)
const storedLang = JSON.parse(localStorage.getItem('ui-storage') || '{}')?.state?.language || 'es';

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: storedLang,
        fallbackLng: 'es',
        interpolation: {
            escapeValue: false
        }
    });

// Subscribe to store changes to update i18n
useUIStore.subscribe((state) => {
    if (state.language !== i18n.language) {
        i18n.changeLanguage(state.language);
    }
});

export default i18n;
