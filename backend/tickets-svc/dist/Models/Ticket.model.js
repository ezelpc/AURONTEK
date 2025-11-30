import mongoose, { Schema } from 'mongoose';
// Enums exportables para controllers y validaciones
export const estadosTicket = ['abierto', 'en_proceso', 'en_espera', 'resuelto', 'cerrado'];
export const prioridades = ['baja', 'media', 'alta', 'crítica'];
export const tipos = ['incidente', 'solicitud', 'consulta', 'problema', 'requerimiento'];
const ticketSchema = new Schema({
    titulo: { type: String, required: true },
    descripcion: { type: String, required: true },
    servicioNombre: String,
    estado: { type: String, enum: estadosTicket, default: 'abierto' },
    tipo: { type: String, enum: tipos },
    prioridad: { type: String, enum: prioridades, default: 'media' },
    categoria: { type: String, trim: true },
    empresaId: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true },
    usuarioCreador: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    agenteAsignado: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario'
    },
    tutor: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario'
    },
    etiquetas: [String],
    adjuntos: [{ nombre: String, url: String, tipo: String }],
    tiempoRespuesta: Number,
    tiempoResolucion: Number,
    fechaLimiteRespuesta: Date,
    fechaLimiteResolucion: Date,
    fechaRespuesta: Date,
    fechaResolucion: Date
}, {
    collection: 'tickets',
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
ticketSchema.index({ empresaId: 1, estado: 1, prioridad: 1, createdAt: -1 });
const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);
export default Ticket;
