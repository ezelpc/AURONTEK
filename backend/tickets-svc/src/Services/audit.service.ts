import TicketHistory, { ITicketHistory } from '../Models/TicketHistory.model';
import mongoose from 'mongoose';

interface AuditLogParams {
    ticketId: string;
    tipo: 'status_change' | 'assignment' | 'priority_change' | 'comment' | 'update' | 'creation' | 'deletion';
    usuarioId: string;
    usuarioNombre: string;
    usuarioCorreo: string;
    cambios: Array<{
        campo: string;
        valorAnterior: any;
        valorNuevo: any;
    }>;
    comentario?: string;
    metadata?: any;
}

class AuditService {
    /**
     * Registra un cambio en el historial del ticket
     */
    async registrarCambio(params: AuditLogParams): Promise<ITicketHistory> {
        try {
            const historyEntry = new TicketHistory({
                ticketId: new mongoose.Types.ObjectId(params.ticketId),
                tipo: params.tipo,
                usuarioId: new mongoose.Types.ObjectId(params.usuarioId),
                usuarioNombre: params.usuarioNombre,
                usuarioCorreo: params.usuarioCorreo,
                cambios: params.cambios,
                comentario: params.comentario,
                metadata: params.metadata || {}
            });

            await historyEntry.save();
            return historyEntry;
        } catch (error) {
            console.error('[AuditService] Error al registrar cambio:', error);
            throw error;
        }
    }

    /**
     * Registra la creación de un ticket
     */
    async registrarCreacion(
        ticketId: string,
        usuario: { id: string; nombre: string; correo: string },
        datosIniciales: any
    ): Promise<ITicketHistory> {
        return this.registrarCambio({
            ticketId,
            tipo: 'creation',
            usuarioId: usuario.id,
            usuarioNombre: usuario.nombre,
            usuarioCorreo: usuario.correo,
            cambios: [
                { campo: 'Estado', valorAnterior: null, valorNuevo: datosIniciales.estado || 'abierto' },
                { campo: 'Prioridad', valorAnterior: null, valorNuevo: datosIniciales.prioridad || 'media' },
                { campo: 'Título', valorAnterior: null, valorNuevo: datosIniciales.titulo }
            ],
            comentario: 'Ticket creado'
        });
    }

    /**
     * Registra un cambio de estado
     */
    async registrarCambioEstado(
        ticketId: string,
        usuario: { id: string; nombre: string; correo: string },
        estadoAnterior: string,
        estadoNuevo: string
    ): Promise<ITicketHistory> {
        return this.registrarCambio({
            ticketId,
            tipo: 'status_change',
            usuarioId: usuario.id,
            usuarioNombre: usuario.nombre,
            usuarioCorreo: usuario.correo,
            cambios: [
                { campo: 'Estado', valorAnterior: estadoAnterior, valorNuevo: estadoNuevo }
            ]
        });
    }

    /**
     * Registra un cambio de prioridad
     */
    async registrarCambioPrioridad(
        ticketId: string,
        usuario: { id: string; nombre: string; correo: string },
        prioridadAnterior: string,
        prioridadNueva: string
    ): Promise<ITicketHistory> {
        return this.registrarCambio({
            ticketId,
            tipo: 'priority_change',
            usuarioId: usuario.id,
            usuarioNombre: usuario.nombre,
            usuarioCorreo: usuario.correo,
            cambios: [
                { campo: 'Prioridad', valorAnterior: prioridadAnterior, valorNuevo: prioridadNueva }
            ]
        });
    }

    /**
     * Registra una asignación de agente
     */
    async registrarAsignacion(
        ticketId: string,
        usuario: { id: string; nombre: string; correo: string },
        agenteAnterior: string | null,
        agenteNuevo: string
    ): Promise<ITicketHistory> {
        return this.registrarCambio({
            ticketId,
            tipo: 'assignment',
            usuarioId: usuario.id,
            usuarioNombre: usuario.nombre,
            usuarioCorreo: usuario.correo,
            cambios: [
                { campo: 'Agente Asignado', valorAnterior: agenteAnterior || 'Sin asignar', valorNuevo: agenteNuevo }
            ]
        });
    }

    /**
     * Registra un comentario
     */
    async registrarComentario(
        ticketId: string,
        usuario: { id: string; nombre: string; correo: string },
        comentario: string
    ): Promise<ITicketHistory> {
        return this.registrarCambio({
            ticketId,
            tipo: 'comment',
            usuarioId: usuario.id,
            usuarioNombre: usuario.nombre,
            usuarioCorreo: usuario.correo,
            cambios: [],
            comentario
        });
    }

    /**
     * Obtiene el historial completo de un ticket
     */
    async obtenerHistorial(ticketId: string): Promise<ITicketHistory[]> {
        try {
            const historial = await TicketHistory.find({
                ticketId: new mongoose.Types.ObjectId(ticketId)
            })
                .sort({ createdAt: -1 }) // Más reciente primero
                .lean();

            return historial as any[];
        } catch (error) {
            console.error('[AuditService] Error al obtener historial:', error);
            throw error;
        }
    }

    /**
     * Obtiene el historial filtrado por tipo
     */
    async obtenerHistorialPorTipo(
        ticketId: string,
        tipo: 'status_change' | 'assignment' | 'priority_change' | 'comment' | 'update' | 'creation' | 'deletion'
    ): Promise<ITicketHistory[]> {
        try {
            const historial = await TicketHistory.find({
                ticketId: new mongoose.Types.ObjectId(ticketId),
                tipo
            })
                .sort({ createdAt: -1 })
                .lean();

            return historial as any[];
        } catch (error) {
            console.error('[AuditService] Error al obtener historial por tipo:', error);
            throw error;
        }
    }

    /**
     * Obtiene el historial de un usuario
     */
    async obtenerHistorialUsuario(usuarioId: string, limit: number = 50): Promise<ITicketHistory[]> {
        try {
            const historial = await TicketHistory.find({
                usuarioId: new mongoose.Types.ObjectId(usuarioId)
            })
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean();

            return historial as any[];
        } catch (error) {
            console.error('[AuditService] Error al obtener historial de usuario:', error);
            throw error;
        }
    }
}

export default new AuditService();
