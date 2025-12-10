// Services/estadisticas.service.ts
import Ticket from '../Models/Ticket.model';
import mongoose from 'mongoose';

class EstadisticasService {
  /**
   * Obtener estadísticas de resolvers (agentes de soporte)
   * Agrupa tickets por resolver y cuenta cuántos han cerrado/resuelto
   */
  async obtenerEstadisticasResolvers(empresaId: string) {
    try {
      const stats = await Ticket.aggregate([
        {
          $match: {
            empresaId: new mongoose.Types.ObjectId(empresaId),
            agenteAsignado: { $exists: true, $ne: null },
            estado: { $in: ['resuelto', 'cerrado'] }
          }
        },
        {
          $group: {
            _id: '$agenteAsignado',
            ticketsResueltos: { $sum: 1 },
            promedioCalificacion: { $avg: '$calificacion.puntuacion' },
            totalCalificaciones: {
              $sum: { $cond: [{ $ifNull: ['$calificacion.puntuacion', false] }, 1, 0] }
            }
          }
        },
        {
          $lookup: {
            from: 'usuarios',
            localField: '_id',
            foreignField: '_id',
            as: 'agente'
          }
        },
        {
          $unwind: '$agente'
        },
        {
          $project: {
            _id: 1,
            nombre: '$agente.nombre',
            correo: '$agente.correo',
            rol: '$agente.rol',
            ticketsResueltos: 1,
            promedioCalificacion: { $round: ['$promedioCalificacion', 2] },
            totalCalificaciones: 1
          }
        },
        {
          $sort: { ticketsResueltos: -1 }
        }
      ]);

      return stats;
    } catch (error) {
      console.error('Error obteniendo estadísticas de resolvers:', error);
      throw error;
    }
  }

  /**
   * Obtener tickets quemados (que excedieron su SLA)
   * Un ticket está quemado si:
   * - Fue resuelto después de su fecha límite de resolución
   * - Está abierto y ya pasó su fecha límite de resolución
   */
  async obtenerTicketsQuemados(empresaId: string) {
    try {
      const ahora = new Date();

      // Tickets resueltos tarde
      const resueltosQuemados = await Ticket.countDocuments({
        empresaId: new mongoose.Types.ObjectId(empresaId),
        estado: { $in: ['resuelto', 'cerrado'] },
        fechaResolucion: { $exists: true },
        fechaLimiteResolucion: { $exists: true },
        $expr: { $gt: ['$fechaResolucion', '$fechaLimiteResolucion'] }
      });

      // Tickets aún abiertos pero ya pasaron su límite
      const abiertosQuemados = await Ticket.countDocuments({
        empresaId: new mongoose.Types.ObjectId(empresaId),
        estado: { $in: ['abierto', 'en_proceso', 'en_espera'] },
        fechaLimiteResolucion: { $lt: ahora }
      });

      const totalQuemados = resueltosQuemados + abiertosQuemados;

      // Total de tickets con SLA definido
      const totalConSLA = await Ticket.countDocuments({
        empresaId: new mongoose.Types.ObjectId(empresaId),
        fechaLimiteResolucion: { $exists: true }
      });

      const porcentaje = totalConSLA > 0 ? ((totalQuemados / totalConSLA) * 100).toFixed(2) : 0;

      return {
        totalQuemados,
        resueltosQuemados,
        abiertosQuemados,
        totalConSLA,
        porcentaje: parseFloat(porcentaje as string)
      };
    } catch (error) {
      console.error('Error obteniendo tickets quemados:', error);
      throw error;
    }
  }

  /**
   * Obtener calificaciones promedio por resolver
   */
  async obtenerCalificacionesResolvers(empresaId: string) {
    try {
      const ratings = await Ticket.aggregate([
        {
          $match: {
            empresaId: new mongoose.Types.ObjectId(empresaId),
            'calificacion.puntuacion': { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$agenteAsignado',
            promedioCalificacion: { $avg: '$calificacion.puntuacion' },
            totalCalificaciones: { $sum: 1 },
            calificaciones: {
              $push: {
                puntuacion: '$calificacion.puntuacion',
                fecha: '$calificacion.fecha',
                ticketId: '$_id'
              }
            }
          }
        },
        {
          $lookup: {
            from: 'usuarios',
            localField: '_id',
            foreignField: '_id',
            as: 'agente'
          }
        },
        {
          $unwind: '$agente'
        },
        {
          $project: {
            _id: 1,
            nombre: '$agente.nombre',
            correo: '$agente.correo',
            promedioCalificacion: { $round: ['$promedioCalificacion', 2] },
            totalCalificaciones: 1,
            calificaciones: 1
          }
        },
        {
          $sort: { promedioCalificacion: -1 }
        }
      ]);

      return ratings;
    } catch (error) {
      console.error('Error obteniendo calificaciones:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas generales de la empresa
   */
  async obtenerEstadisticasGenerales(empresaId: string) {
    try {
      const total = await Ticket.countDocuments({
        empresaId: new mongoose.Types.ObjectId(empresaId)
      });

      const abiertos = await Ticket.countDocuments({
        empresaId: new mongoose.Types.ObjectId(empresaId),
        estado: 'abierto'
      });

      const enProceso = await Ticket.countDocuments({
        empresaId: new mongoose.Types.ObjectId(empresaId),
        estado: 'en_proceso'
      });

      const resueltos = await Ticket.countDocuments({
        empresaId: new mongoose.Types.ObjectId(empresaId),
        estado: { $in: ['resuelto', 'cerrado'] }
      });

      return {
        total,
        abiertos,
        enProceso,
        en_progreso: enProceso, // Alias para compatibilidad
        resueltos
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas generales:', error);
      throw error;
    }
  }
}

export default new EstadisticasService();
