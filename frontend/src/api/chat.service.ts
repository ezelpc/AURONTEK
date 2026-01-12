import api from './axios';

export interface Message {
    _id: string;
    ticketId: string;
    empresaId: string;
    emisorId: {
        _id: string;
        nombre: string;
        rol: string;
        fotoPerfil?: string;
    };
    tipo: 'texto' | 'imagen' | 'archivo' | 'sistema';
    contenido: string;
    leidoPor: Array<{
        usuarioId: string;
        fecha: Date;
    }>;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
}

export const chatService = {
    // Obtener historial de mensajes de un ticket
    getHistory: async (ticketId: string, limite = 50, desde?: Date): Promise<Message[]> => {
        const params: any = { limite };
        if (desde) params.desde = desde.toISOString();

        const response = await api.get<Message[]>(`/chat/${ticketId}/mensajes`, { params });
        return response.data;
    },

    // Enviar un mensaje (también se puede hacer via WebSocket)
    sendMessage: async (ticketId: string, contenido: string, tipo: 'texto' | 'imagen' | 'archivo' = 'texto', metadata?: any): Promise<Message> => {
        const response = await api.post<Message>(`/chat/${ticketId}/mensajes`, {
            contenido,
            tipo,
            metadata
        });
        return response.data;
    }
};
