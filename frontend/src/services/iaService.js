const IA_SERVICE_URL = import.meta.env.VITE_IA_URL || 'http://localhost:3005';

/**
 * Servicio para interacción con el servicio de IA
 */
const iaService = {
  /**
   * Clasificar un ticket usando IA
   * @param {Object} ticketData - Datos del ticket
   */
  clasificarTicket: async (ticketData) => {
    try {
      const response = await fetch(`${IA_SERVICE_URL}/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
      });

      if (!response.ok) {
        throw new Error('Error al clasificar ticket');
      }

      const data = await response.json();
      return data.classification;
    } catch (error) {
      console.error('Error clasificando ticket:', error);
      throw error;
    }
  },

  /**
   * Sugerir agente para un ticket
   * @param {Object} ticketData - Datos del ticket
   */
  sugerirAgente: async (ticketData) => {
    try {
      const response = await fetch(`${IA_SERVICE_URL}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
      });

      if (!response.ok) {
        throw new Error('Error al sugerir agente');
      }

      const data = await response.json();
      return data.agent;
    } catch (error) {
      console.error('Error sugiriendo agente:', error);
      throw error;
    }
  },

  /**
   * Obtener estado del servicio de IA
   */
  obtenerEstadoIA: async () => {
    try {
      const response = await fetch(`${IA_SERVICE_URL}/health`);
      
      if (!response.ok) {
        throw new Error('Servicio de IA no disponible');
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo estado de IA:', error);
      throw error;
    }
  },

  /**
   * Consultar IA (chat con asistente)
   * @param {string} pregunta - Pregunta del usuario
   * @param {Object} contexto - Contexto adicional
   */
  consultarIA: async (pregunta, contexto = {}) => {
    try {
      const response = await fetch(`${IA_SERVICE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pregunta,
          contexto,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al consultar IA');
      }

      const data = await response.json();
      return data.respuesta;
    } catch (error) {
      console.error('Error consultando IA:', error);
      throw error;
    }
  },

  /**
   * Obtener sugerencias mientras el usuario escribe
   * @param {string} texto - Texto parcial
   * @param {string} campo - Campo que se está editando (titulo, descripcion, etc)
   */
  obtenerSugerencias: async (texto, campo) => {
    try {
      if (!texto || texto.length < 10) {
        return null;
      }

      const response = await fetch(`${IA_SERVICE_URL}/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texto,
          campo,
        }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.sugerencias;
    } catch (error) {
      console.error('Error obteniendo sugerencias:', error);
      return null;
    }
  },

  /**
   * Formatear clasificación de IA para mostrar
   * @param {Object} clasificacion - Clasificación cruda
   */
  formatearClasificacion: (clasificacion) => {
    return {
      tipo: clasificacion.tipo || 'Consulta',
      prioridad: clasificacion.prioridad || 'Media',
      categoria: clasificacion.categoria || 'General',
      grupoAtencion: clasificacion.grupo_atencion || clasificacion.grupoAtencion || 'Soporte',
      tiempoResolucion: clasificacion.tiempoResolucion || clasificacion.tiempo_resolucion || 60,
      confianza: clasificacion.confianza || 0.8,
    };
  },
};

export default iaService;
