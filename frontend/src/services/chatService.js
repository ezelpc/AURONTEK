import api from '../api/api';

const CHAT_BASE_URL = import.meta.env.VITE_CHAT_URL || 'http://localhost:3003';

/**
 * Servicio para chat (REST API)
 * La conexión Socket.IO se maneja a través del hook useSocket
 */
const chatService = {
  /**
   * Obtener historial de chat de un ticket
   * @param {string} ticketId - ID del ticket
   * @param {Object} options - { limite, desde }
   */
  obtenerHistorial: async (ticketId, options = {}) => {
    try {
      const { limite = 50, desde } = options;
      const params = new URLSearchParams({ limite: limite.toString() });
      
      if (desde) {
        params.append('desde', desde.toISOString());
      }

      // Usar axios directamente para el servicio de chat
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${CHAT_BASE_URL}/chat/${ticketId}/historial?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener historial');
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo historial de chat:', error);
      throw error;
    }
  },

  /**
   * Subir archivo al chat
   * @param {File} file - Archivo a subir
   * @param {string} ticketId - ID del ticket
   */
  subirArchivo: async (file, ticketId) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('ticketId', ticketId);

      const response = await api.post('/chat/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      throw error;
    }
  },

  /**
   * Formatear mensaje para mostrar
   * @param {Object} mensaje - Mensaje del chat
   */
  formatearMensaje: (mensaje) => {
    return {
      id: mensaje._id || mensaje.id,
      contenido: mensaje.contenido,
      tipo: mensaje.tipo || 'texto',
      emisor: {
        id: mensaje.emisor?._id || mensaje.emisorId,
        nombre: mensaje.emisor?.nombre || 'Usuario',
        rol: mensaje.emisor?.rol || 'usuario',
      },
      fecha: new Date(mensaje.createdAt || mensaje.fecha),
      leido: mensaje.leido || false,
      metadata: mensaje.metadata || {},
    };
  },

  /**
   * Agrupar mensajes por fecha
   * @param {Array} mensajes - Lista de mensajes
   */
  agruparPorFecha: (mensajes) => {
    const grupos = {};
    
    mensajes.forEach(mensaje => {
      const fecha = new Date(mensaje.createdAt || mensaje.fecha);
      const key = fecha.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      if (!grupos[key]) {
        grupos[key] = [];
      }
      
      grupos[key].push(chatService.formatearMensaje(mensaje));
    });
    
    return grupos;
  },
};

export default chatService;
