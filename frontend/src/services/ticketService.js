import api from '../api/api';

const TICKETS_BASE = '/tickets';

/**
 * Servicio completo para gestión de tickets
 */
const ticketService = {
  /**
   * Listar tickets con filtros opcionales
   * @param {Object} filtros - { estado, prioridad, agenteId, empresaId, page, limit }
   */
  listarTickets: async (filtros = {}) => {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const response = await api.get(`${TICKETS_BASE}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error listando tickets:', error);
      throw error;
    }
  },

  /**
   * Obtener detalle de un ticket
   * @param {string} id - ID del ticket
   */
  obtenerTicket: async (id) => {
    try {
      const response = await api.get(`${TICKETS_BASE}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo ticket:', error);
      throw error;
    }
  },

  /**
   * Crear nuevo ticket
   * @param {Object} data - Datos del ticket
   */
  crearTicket: async (data) => {
    try {
      const response = await api.post(TICKETS_BASE, data);
      return response.data;
    } catch (error) {
      console.error('Error creando ticket:', error);
      throw error;
    }
  },

  /**
   * Actualizar estado de un ticket
   * @param {string} id - ID del ticket
   * @param {string} estado - Nuevo estado
   * @param {string} comentario - Comentario opcional
   */
  actualizarEstado: async (id, estado, comentario = '') => {
    try {
      const response = await api.put(`${TICKETS_BASE}/${id}/estado`, {
        estado,
        comentario
      });
      return response.data;
    } catch (error) {
      console.error('Error actualizando estado:', error);
      throw error;
    }
  },

  /**
   * Asignar ticket a un agente
   * @param {string} id - ID del ticket
   * @param {string} agenteId - ID del agente
   */
  asignarTicket: async (id, agenteId) => {
    try {
      const response = await api.put(`${TICKETS_BASE}/${id}/asignar`, {
        agenteId
      });
      return response.data;
    } catch (error) {
      console.error('Error asignando ticket:', error);
      throw error;
    }
  },

  /**
   * Delegar ticket a un becario
   * @param {string} id - ID del ticket
   * @param {string} becarioId - ID del becario
   */
  delegarTicket: async (id, becarioId) => {
    try {
      const response = await api.put(`${TICKETS_BASE}/${id}/delegar`, {
        becarioId
      });
      return response.data;
    } catch (error) {
      console.error('Error delegando ticket:', error);
      throw error;
    }
  },

  /**
   * Verificar acceso al chat de un ticket
   * @param {string} id - ID del ticket
   */
  verificarAccesoChat: async (id) => {
    try {
      const response = await api.get(`${TICKETS_BASE}/${id}/acceso-chat`);
      return response.data;
    } catch (error) {
      console.error('Error verificando acceso al chat:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de tickets
   */
  obtenerEstadisticas: async () => {
    try {
      const response = await api.get(`${TICKETS_BASE}/estadisticas`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  },
};

export default ticketService;
