import api from '../api/api';

const NOTIFICACIONES_BASE = '/notificaciones';

/**
 * Servicio para gestión de notificaciones
 */
const notificacionesService = {
  /**
   * Obtener todas las notificaciones del usuario actual
   * @param {Object} filtros - { leida, tipo, limite }
   */
  obtenerNotificaciones: async (filtros = {}) => {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const queryString = params.toString();
      const url = queryString ? `${NOTIFICACIONES_BASE}?${queryString}` : NOTIFICACIONES_BASE;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      throw error;
    }
  },

  /**
   * Marcar una notificación como leída
   * @param {string} id - ID de la notificación
   */
  marcarLeida: async (id) => {
    try {
      const response = await api.patch(`${NOTIFICACIONES_BASE}/${id}/leer`);
      return response.data;
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      throw error;
    }
  },

  /**
   * Marcar todas las notificaciones como leídas
   */
  marcarTodasLeidas: async () => {
    try {
      const response = await api.patch(`${NOTIFICACIONES_BASE}/leer-todas`);
      return response.data;
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
      throw error;
    }
  },

  /**
   * Obtener contador de notificaciones no leídas
   */
  obtenerNoLeidas: async () => {
    try {
      const response = await api.get(`${NOTIFICACIONES_BASE}/no-leidas/count`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo contador de no leídas:', error);
      throw error;
    }
  },

  /**
   * Eliminar una notificación
   * @param {string} id - ID de la notificación
   */
  eliminarNotificacion: async (id) => {
    try {
      const response = await api.delete(`${NOTIFICACIONES_BASE}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error eliminando notificación:', error);
      throw error;
    }
  },

  /**
   * Obtener preferencias de notificaciones
   */
  obtenerPreferencias: async () => {
    try {
      const response = await api.get(`${NOTIFICACIONES_BASE}/preferencias`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo preferencias:', error);
      throw error;
    }
  },

  /**
   * Actualizar preferencias de notificaciones
   * @param {Object} preferencias - Nuevas preferencias
   */
  actualizarPreferencias: async (preferencias) => {
    try {
      const response = await api.put(`${NOTIFICACIONES_BASE}/preferencias`, preferencias);
      return response.data;
    } catch (error) {
      console.error('Error actualizando preferencias:', error);
      throw error;
    }
  },

  /**
   * Formatear notificación para mostrar
   * @param {Object} notificacion - Notificación cruda
   */
  formatearNotificacion: (notificacion) => {
    return {
      id: notificacion._id || notificacion.id,
      titulo: notificacion.titulo,
      mensaje: notificacion.mensaje,
      tipo: notificacion.tipo || 'info', // info, success, warning, error
      leida: notificacion.leida || false,
      fecha: new Date(notificacion.createdAt || notificacion.fecha),
      enlace: notificacion.enlace || null,
      metadata: notificacion.metadata || {},
    };
  },
};

export default notificacionesService;
