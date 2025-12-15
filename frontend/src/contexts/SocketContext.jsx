import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';

const SocketContext = createContext(null);

/**
 * Provider para Socket.IO
 * Proporciona una conexión única compartida en toda la aplicación
 */
export const SocketProvider = ({ children }) => {
    const socketData = useSocket();

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
