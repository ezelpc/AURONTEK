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
  agenteAsignado?: mongoose.Types.ObjectId;
  tutor?: mongoose.Types.ObjectId;
  etiquetas?: string[];
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
  createdAt?: Date;
  updatedAt?: Date;
}

// Enums exportables para controllers y validaciones
export const estadosTicket = ['abierto', 'en_proceso', 'en_espera', 'resuelto', 'cerrado'] as const;
export const prioridades = ['baja', 'media', 'alta', 'crítica'] as const;
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
  fechaResolucion: Date,

  calificacion: {
    puntuacion: { type: Number, min: 1, max: 5 },
    comentario: String,
    fecha: Date
  }

}, {
  collection: 'tickets',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

ticketSchema.index({ empresaId: 1, estado: 1, prioridad: 1, createdAt: -1 });

const Ticket = mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', ticketSchema);
export default Ticket;
