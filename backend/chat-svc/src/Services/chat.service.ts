import Mensaje from '../Models/Mensaje.model';
import axios from 'axios';

interface GuardarMensajeData {
    ticketId: string;
    empresaId: string;
    emisorId: string;
    tipo?: 'texto' | 'imagen' | 'archivo' | 'sistema';
    contenido: string;
    metadata?: any;
}

interface ObtenerHistorialOpciones {
    limite?: number;
    desde?: Date;
}

class ChatService {
    async validarAcceso(usuarioId: string, ticketId: string): Promise<boolean> {
        try {
            const ticketResponse = await axios.get(
                `${process.env.TICKETS_SVC_URL || 'http://localhost:3002'}/tickets/${ticketId}/verificar-acceso-chat`,
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.SERVICE_TOKEN}`,
                        'X-Service-Name': 'chat-svc',
                        'X-User-Id': usuarioId
                    }
                }
            );

            const result = ticketResponse.data;
            return result.acceso || false;

        } catch (error: any) {
            console.error('Error validando acceso via tickets-svc:', error.message);
            return false;
        }
    }

    async guardarMensaje(data: GuardarMensajeData) {
        const accesoValido = await this.validarAcceso(data.emisorId, data.ticketId);
        if (!accesoValido) throw new Error('No tienes permiso para participar en este chat.');

        const mensaje: any = new Mensaje({
            ticketId: data.ticketId,
            empresaId: data.empresaId,
            emisorId: data.emisorId,
            tipo: data.tipo,
            contenido: data.contenido,
            metadata: data.metadata,
            leidoPor: [{ usuarioId: data.emisorId }]
        });

        return await mensaje.save();
    }

    async obtenerHistorialChat(ticketId: string, usuarioId: string, opciones: ObtenerHistorialOpciones = {}) {
        const accesoValido = await this.validarAcceso(usuarioId, ticketId);
        if (!accesoValido) throw new Error('No autorizado para ver este historial');

        const { limite = 50, desde } = opciones;
        const query: any = { ticketId };
        if (desde) query.createdAt = { $lt: desde };

        return await (Mensaje as any).find(query)
            .sort({ createdAt: 1 })
            .limit(limite)
            .populate('emisorId', 'nombre rol fotoPerfil');
    }

    async marcarComoLeido(mensajeId: string, usuarioId: string) {
        return await (Mensaje as any).findByIdAndUpdate(
            mensajeId,
            { $addToSet: { leidoPor: { usuarioId: usuarioId, fecha: new Date() } } },
            { new: true }
        );
    }
}

export default new ChatService();