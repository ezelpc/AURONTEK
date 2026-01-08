import mongoose, { Document, Schema } from 'mongoose';

// Interfaces para TypeScript
export interface ITicket extends Document {
  titulo: string;
  descripcion: string;
  servicioId?: mongoose.Types.ObjectId;
  servicioNombre?: string;
  estado: 'abierto' | 'en_proceso' | 'en_espera' | 'resuelto' | 'cerrado';
  tipo?: 'incidente' | 'solicitud' | 'consulta' | 'problema' | 'requerimiento';
  prioridad: 'baja' | 'media' | 'alta' | 'crítica';
  categoria?: string;
  empresaId: mongoose.Types.ObjectId;
  usuarioCreador: mongoose.Types.ObjectId;
  usuarioCreadorEmail?: string; // Denormalized email for notifications
  agenteAsignado?: mongoose.Types.ObjectId;
  fechaAsignacion?: Date; // Timestamp de asignación al agente (para detectar estancamiento)
  tutor?: mongoose.Types.ObjectId;
  etiquetas?: string[];
  grupo_atencion?: string; // Grupo técnico responsable (ej: "Mesa de Servicio")
  adjuntos?: Array<{
    nombre: string;
    url: string;
    tipo: string;
  }>;
  tiempoRespuesta?: number;
  tiempoResolucion?: number;
  fechaLimiteRespuesta?: Date;
  fechaLimiteResolucion?: Date;
  fechaRespuesta?: Date;
  fechaResolucion?: Date;
  calificacion?: {
    puntuacion: number; // 1-5 stars
    comentario?: string;
    fecha: Date;
  };
  // Campos para tracking de tiempo en espera (pausa de SLA)
  tiempoEnEspera?: number; // Milisegundos acumulados en estado "en_espera"
  fechaInicioEspera?: Date; // Cuando entró en estado "en_espera"
  historialEspera?: Array<{
    inicio: Date;
    fin?: Date;
    duracion?: number; // Milisegundos
    motivo?: string;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

// Enums exportables para controllers y validaciones
export const estadosTicket = ['abierto', 'en_proceso', 'en_espera', 'resuelto', 'cerrado'] as const;
export const prioridades = ['baja', 'media', 'alta', 'crítica', 'critica'] as const;
export const tipos = ['incidente', 'solicitud', 'consulta', 'problema', 'requerimiento'] as const;

const ticketSchema = new Schema<ITicket>({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  servicioId: { type: Schema.Types.ObjectId, ref: 'Servicio' },
  servicioNombre: String,

  estado: { type: String, enum: estadosTicket, default: 'abierto' },
  tipo: { type: String, enum: tipos },
  prioridad: { type: String, enum: prioridades, default: 'media' },

  categoria: { type: String, trim: true },

  empresaId: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true },
  usuarioCreador: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  usuarioCreadorEmail: { type: String },

  agenteAsignado: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario'
  },

  fechaAsignacion: Date, // Timestamp de cuando se asignó el agente

  tutor: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario'
  },

  etiquetas: [String],
  grupo_atencion: { type: String, trim: true }, // Grupo técnico asignado
  adjuntos: [{ nombre: String, url: String, tipo: String }],

  tiempoRespuesta: Number,
  tiempoResolucion: Number,
  fechaLimiteRespuesta: Date,
  fechaLimiteResolucion: Date,
  fechaRespuesta: Date,
  fechaResolucion: Date,

  calificacion: {
    puntuacion: { type: Number, min: 1, max: 5 },
    comentario: String,
    fecha: Date
  },

  // Campos para tracking de tiempo en espera
  tiempoEnEspera: { type: Number, default: 0 }, // Milisegundos acumulados
  fechaInicioEspera: Date,
  historialEspera: [{
    inicio: { type: Date, required: true },
    fin: Date,
    duracion: Number,
    motivo: String
  }]

}, {
  collection: 'tickets',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

ticketSchema.index({ empresaId: 1, estado: 1, prioridad: 1, createdAt: -1 });

const Ticket = mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', ticketSchema);
export default Ticket;
