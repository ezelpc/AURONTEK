import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { getToken } from '../api/api';

const SocketContext = createContext(null);

/**
 * Provider para Socket.IO
 * Proporciona una conexión única compartida en toda la aplicación
 */
export const SocketProvider = ({ children }) => {
    const [token, setToken] = useState(null);

    // Obtener token al montar y cuando cambie
    useEffect(() => {
        const currentToken = getToken();
        setToken(currentToken);

        // Escuchar cambios en localStorage
        const handleStorageChange = () => {
            const newToken = getToken();
            setToken(newToken);
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const socketData = useSocket(token);

    return (
        <SocketContext.Provider value={socketData}>
            {children}
        </SocketContext.Provider>
    );
};

/**
 * Hook para usar el contexto de Socket
 */
export const useSocketContext = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocketContext debe usarse dentro de SocketProvider');
    }
    return context;
};

export default SocketContext;
