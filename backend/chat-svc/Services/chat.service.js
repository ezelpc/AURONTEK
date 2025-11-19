import Mensaje from '../Models/Mensaje.model.js';
import Ticket from '../../tickets-svc/Models/Ticket.model.js';
import Usuario from '../../usuarios-svc/Models/AltaUsuario.models.js';

class ChatService {
    
    async validarAcceso(usuarioId, ticketId) {
        try {
            const ticket = await Ticket.findById(ticketId);
            const usuarioSolicitante = await Usuario.findById(usuarioId);

            if (!ticket || !usuarioSolicitante) return false;

            const idSolicitante = usuarioSolicitante._id.toString();

            // 1. Acceso Admin Global
            if (usuarioSolicitante.rol === 'admin-general') return true;

            // 2. Acceso Dueño del Ticket (Usuario normal)
            if (ticket.usuarioCreador.toString() === idSolicitante) return true;

            // 3. Acceso Agente Asignado (Sea Soporte o Beca-Soporte)
            if (ticket.agenteAsignado && ticket.agenteAsignado.toString() === idSolicitante) return true;

            // 4. ACCESO TUTOR (Lógica solicitada)
            // Si el usuario actual está registrado como el 'tutor' del ticket, tiene acceso total.
            if (ticket.tutor && ticket.tutor.toString() === idSolicitante) {
                console.log(`[Chat] Acceso concedido a Tutor: ${usuarioSolicitante.nombre}`);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error validando acceso:', error);
            return false;
        }
    }

    async guardarMensaje(data) {
        const accesoValido = await this.validarAcceso(data.emisorId, data.ticketId);
        if (!accesoValido) throw new Error('No tienes permiso para participar en este chat.');

        const mensaje = new Mensaje({
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

    async obtenerHistorialChat(ticketId, usuarioId, opciones = {}) {
        const accesoValido = await this.validarAcceso(usuarioId, ticketId);
        if (!accesoValido) throw new Error('No autorizado para ver este historial');

        const { limite = 50, desde } = opciones;
        const query = { ticketId };
        if (desde) query.createdAt = { $lt: desde };

        return await Mensaje.find(query)
            .sort({ createdAt: 1 })
            .limit(limite)
            .populate('emisorId', 'nombre rol fotoPerfil'); 
    }

    // ... (Resto de métodos: marcarComoLeido, etc. se mantienen igual)
    async marcarComoLeido(mensajeId, usuarioId) {
        return await Mensaje.findByIdAndUpdate(
            mensajeId,
            { $addToSet: { leidoPor: { usuarioId: usuarioId, fecha: new Date() } } },
            { new: true }
        );
    }
}

export default new ChatService();