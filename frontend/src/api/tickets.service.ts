import api from '@/api/axios';
import { Ticket } from '@/types/api.types';

export const ticketsService = {
    // Obtener todos los tickets (con filtros opcionales query params)
    getTickets: async (filters?: {
        estado?: string;
        prioridad?: string;
        asignado?: boolean; // true = solo asignados a mi
        empresaId?: string; // filtrar por empresa específica
        tipo?: string;
    }): Promise<Ticket[]> => {
        // Backend endpoint: GET /api/tickets
        // El backend ya filtra por permisos gracias al middleware
        // Backend devuelve: { data: Ticket[], pagina, limite, total }
        const params = new URLSearchParams();
        if (filters?.estado) params.append('estado', filters.estado);
        if (filters?.prioridad) params.append('prioridad', filters.prioridad);
        if (filters?.asignado) params.append('asignado', 'true');
        if (filters?.empresaId) params.append('empresaId', filters.empresaId);
        if (filters?.tipo) params.append('tipo', filters.tipo);

        const queryString = params.toString();
        const url = queryString ? `/tickets?${queryString}` : '/tickets';

        const response = await api.get<{ data: Ticket[], pagina: number, limite: number, total: number }>(url);
        return response.data.data; // Extraer el array de tickets del objeto paginado
    },

    // Obtener un ticket por ID
    getTicketById: async (id: string): Promise<Ticket> => {
        const response = await api.get<Ticket>(`/tickets/${id}`);
        return response.data;
    },

    // Crear nuevo ticket
    createTicket: async (ticketData: Partial<Ticket>): Promise<Ticket> => {
        const response = await api.post<Ticket>('/tickets', ticketData);
        return response.data;
    },

    // Agregar mensaje/comentario (Chat)
    addMessage: async (ticketId: string, mensaje: string): Promise<any> => {
        // Asumiendo endpoint POST /tickets/:id/mensajes o similiar
        const response = await api.post(`/tickets/${ticketId}/mensajes`, { contenido: mensaje });
        return response.data;
    },

    // Actualizar estado/prioridad
    updateTicket: async (id: string, updates: Partial<Ticket>): Promise<Ticket> => {
        const response = await api.patch<Ticket>(`/tickets/${id}`, updates);
        return response.data;
    },

    // Actualizar estado de ticket (Admin)
    updateTicketStatus: async (id: string, estado: string): Promise<Ticket> => {
        const response = await api.patch<{ ticket: Ticket }>(`/tickets/admin/${id}/estado`, { estado });
        return response.data.ticket;
    },

    // Actualizar prioridad de ticket (Admin)
    updateTicketPriority: async (id: string, prioridad: string): Promise<Ticket> => {
        const response = await api.patch<{ ticket: Ticket }>(`/tickets/admin/${id}/prioridad`, { prioridad });
        return response.data.ticket;
    },

    // Asignar agente a ticket (Admin)
    assignTicket: async (id: string, agenteId: string, empresaId: string): Promise<Ticket> => {
        const response = await api.patch<{ ticket: Ticket }>(`/tickets/admin/${id}/asignar`, { agenteId, empresaId });
        return response.data.ticket;
    },

    // Eliminar ticket (Admin) - si existe el endpoint
    deleteTicket: async (id: string): Promise<void> => {
        await api.delete(`/tickets/${id}`);
    },

    // Estadísticas Globales (Admin)
    getGlobalStats: async (): Promise<any> => {
        const response = await api.get('/tickets/estadisticas/global');
        return response.data;
    },

    // Tickets Internos de Aurontek HQ (Admin)
    getInternalTickets: async (filters?: {
        estado?: string;
        prioridad?: string;
        fechaInicio?: string;
        fechaFin?: string;
    }): Promise<Ticket[]> => {
        const params = new URLSearchParams();
        if (filters?.estado) params.append('estado', filters.estado);
        if (filters?.prioridad) params.append('prioridad', filters.prioridad);
        if (filters?.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
        if (filters?.fechaFin) params.append('fechaFin', filters.fechaFin);

        const queryString = params.toString();
        const url = queryString ? `/tickets/admin/internos?${queryString}` : '/tickets/admin/internos';

        const response = await api.get<Ticket[]>(url);
        return response.data;
    },

    // Tickets de Empresas Externas (Admin)
    getCompanyTickets: async (filters?: {
        estado?: string;
        prioridad?: string;
        empresa?: string;
        fechaInicio?: string;
        fechaFin?: string;
    }): Promise<Ticket[]> => {
        const params = new URLSearchParams();
        if (filters?.estado) params.append('estado', filters.estado);
        if (filters?.prioridad) params.append('prioridad', filters.prioridad);
        if (filters?.empresa) params.append('empresa', filters.empresa);
        if (filters?.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
        if (filters?.fechaFin) params.append('fechaFin', filters.fechaFin);

        const queryString = params.toString();
        const url = queryString ? `/tickets/admin/empresas?${queryString}` : '/tickets/admin/empresas';

        const response = await api.get<Ticket[]>(url);
        return response.data;
    },

    // Subir archivos adjuntos
    uploadFiles: async (files: File[]): Promise<any[]> => {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        const response = await api.post('/tickets/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data.files;
    },

    // Obtener historial de cambios del ticket
    getTicketHistory: async (ticketId: string): Promise<any[]> => {
        const response = await api.get(`/tickets/${ticketId}/history`);
        return response.data;
    }
};
