import api from '@/api/axios';

export interface Mensaje {
    _id: string;
    ticketId: string;
    empresaId: string;
    emisorId: {
        _id: string;
        nombre: string;
        rol: string;
        fotoPerfil?: string;
    } | string;
    tipo: 'texto' | 'imagen' | 'archivo' | 'sistema';
    contenido: string;
    metadata?: any;
    leidoPor: { usuarioId: string; fecha: string }[];
    createdAt: string;
}

export const chatService = {
    // Obtener historial de chat
    getHistory: async (ticketId: string): Promise<Mensaje[]> => {
        const response = await api.get(`/chat/${ticketId}/mensajes`);
        return response.data;
    },

    // Enviar mensaje
    sendMessage: async (ticketId: string, contenido: string, tipo: 'texto' | 'imagen' | 'archivo' = 'texto', file?: File) => {
        // Si es archivo/imagen, usar FormData? 
        // Por ahora basic json for text
        if (tipo === 'texto') {
            const response = await api.post(`/chat/${ticketId}/mensajes`, {
                contenido,
                tipo
            });
            return response.data;
        } else {
            // TODO: Implement file upload logic if needed, usually separate endpoint or FormData
            const formData = new FormData();
            formData.append('contenido', contenido);
            formData.append('tipo', tipo);
            if (file) formData.append('file', file);

            const response = await api.post(`/chat/${ticketId}/mensajes`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        }
    },

    // Marcar como leído
    markAsRead: async (ticketId: string, mensajeId: string) => {
        await api.put(`/chat/${ticketId}/mensajes/${mensajeId}/leer`);
    }
};
