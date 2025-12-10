import api from '../api/api';

const ESTADISTICAS_BASE = '/tickets/estadisticas';

/**
 * Servicio para obtener estadísticas del dashboard
 */
const estadisticasService = {
  /**
   * Obtener estadísticas de resolvers (performance de agentes)
   */
  obtenerEstadisticasResolvers: async () => {
    try {
      const response = await api.get(`${ESTADISTICAS_BASE}/resolvers`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas de resolvers:', error);
      throw error;
    }
  },

  /**
   * Obtener tickets quemados (que excedieron SLA)
   */
  obtenerTicketsQuemados: async () => {
    try {
      const response = await api.get(`${ESTADISTICAS_BASE}/quemados`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo tickets quemados:', error);
      throw error;
    }
  },

  /**
   * Obtener calificaciones promedio por resolver
   */
  obtenerCalificacionesResolvers: async () => {
    try {
      const response = await api.get(`${ESTADISTICAS_BASE}/calificaciones`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo calificaciones:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas generales
   */
  obtenerEstadisticasGenerales: async () => {
    try {
      const response = await api.get(ESTADISTICAS_BASE);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas generales:', error);
      throw error;
    }
  },
};

export default estadisticasService;
