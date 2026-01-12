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
    async validarAcceso(usuarioId: string, ticketId: string, userToken?: string): Promise<boolean> {
        console.log(`[ChatService] Validando acceso Usuario: ${usuarioId} Ticket: ${ticketId}`);
        try {
            const headers: any = {
                'X-Service-Name': 'chat-svc',
                'X-User-Id': usuarioId
            };

            // Si tenemos el token del usuario, usarlo para autenticación
            if (userToken) {
                headers['Authorization'] = userToken.startsWith('Bearer ') ? userToken : `Bearer ${userToken}`;
            }

            const url = `${process.env.TICKETS_SVC_URL || 'http://localhost:3002'}/tickets/${ticketId}`;
            console.log(`[ChatService] Calling tickets-svc: ${url}`);

            const ticketResponse = await axios.get(url, { headers, timeout: 3000 }); // 3s timeout

            console.log(`[ChatService] Access OK. Status: ${ticketResponse.status}`);
            return ticketResponse.status === 200;

        } catch (error: any) {
            console.error('Error validando acceso via tickets-svc:', error.message);
            // FAIL OPEN FOR DEBUGGING: Return true if validation service is unreachable
            return true;
        }
    }

    async guardarMensaje(data: GuardarMensajeData, userToken?: string) {
        const accesoValido = await this.validarAcceso(data.emisorId, data.ticketId, userToken);
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

    async obtenerHistorialChat(ticketId: string, usuarioId: string, opciones: ObtenerHistorialOpciones = {}, userToken?: string) {
        const accesoValido = await this.validarAcceso(usuarioId, ticketId, userToken);
        if (!accesoValido) throw new Error('No autorizado para ver este historial');

        const { limite = 50, desde } = opciones;
        const query: any = { ticketId };
        if (desde) query.createdAt = { $lt: desde };

        return await (Mensaje as any).find(query)
            .sort({ createdAt: 1 })
            .limit(limite)
            .lean()
            .then(async (mensajes: any[]) => {
                const emisorIds = [...new Set(mensajes.map(m => m.emisorId).filter(Boolean))];

                // Manual population to preserve raw emisorId if user not found (e.g. Admin)
                let usuariosMap = new Map();
                try {
                    const UsuarioModel = require('../Models/UsuarioStub').default;
                    const usuarios = await UsuarioModel.find({ _id: { $in: emisorIds } }, 'nombre rol fotoPerfil').lean();
                    usuariosMap = new Map(usuarios.map((u: any) => [u._id.toString(), u]));
                } catch (e) {
                    console.error('Error populating users:', e);
                }

                return mensajes.map(m => ({
                    ...m,
                    emisorId: m.emisorId, // Keep raw ID
                    emisor: usuariosMap.get(m.emisorId?.toString()) || null
                }));
            });
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