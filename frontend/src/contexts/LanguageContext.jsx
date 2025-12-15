import React, { createContext, useState, useContext } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(localStorage.getItem('lang') || 'es');

    const toggleLanguage = () => {
        const newLang = language === 'es' ? 'en' : 'es';
        setLanguage(newLang);
        localStorage.setItem('lang', newLang);
    };

    const t = (key) => {
        const dictionary = {
            es: {
                'dashboard': 'Dashboard',
                'tickets': 'Gestión Tickets',
                'my_tickets': 'Mis Tickets',
                'create_ticket': 'Crear Ticket',
                'services': 'Catálogo de Servicios',
                'users': 'Usuarios',
                'profile': 'Mi Perfil',
                'dark_mode': 'Modo Oscuro',
                'light_mode': 'Modo Claro',
                'help': 'Ayuda',
                'logout': 'Cerrar Sesión',
                'portal': 'PORTAL EMPRESA'
            },
            en: {
                'dashboard': 'Dashboard',
                'tickets': 'Ticket Management',
                'my_tickets': 'My Tickets',
                'create_ticket': 'Create Ticket',
                'services': 'Service Catalog',
                'users': 'Users',
                'profile': 'My Profile',
                'dark_mode': 'Dark Mode',
                'light_mode': 'Light Mode',
                'help': 'Help',
                'logout': 'Logout',
                'portal': 'COMPANY PORTAL'
            }
        };
        return dictionary[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
