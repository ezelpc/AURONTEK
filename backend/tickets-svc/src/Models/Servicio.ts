import mongoose, { Schema, Document } from 'mongoose';

export interface IServicio extends Document {
  nombre: string;
  tipo: 'Requerimiento' | 'Incidente';
  categoria: string;
  dependencias?: string;
  cicloDeVida?: string;
  impacto?: string;
  urgencia?: string;
  prioridad?: 'Alta' | 'Media' | 'Baja' | 'critica';
  sla?: string;
  cliente?: string;
  gruposDeAtencion?: string;
  empresaId?: mongoose.Types.ObjectId;
  alcance: 'global' | 'local';
  plantilla?: {
    campo: string;
    tipo: 'texto' | 'numero' | 'fecha' | 'lista';
    opciones?: string[]; // Para tipo lista
    requerido: boolean;
  }[];
  activo: boolean;
}

const servicioSchema: Schema = new Schema({
  nombre: { type: String, required: true, trim: true },
  tipo: { type: String, required: true, enum: ['Requerimiento', 'Incidente'] },
  categoria: { type: String, required: true, trim: true },
  dependencias: { type: String, trim: true },
  cicloDeVida: { type: String, trim: true, default: 'Activos' },
  impacto: { type: String },
  urgencia: { type: String },
  prioridad: { type: String, enum: ['Alta', 'Media', 'Baja', 'critica', 'Critica', 'crítica', 'Crítica'] },
  sla: { type: String },
  cliente: { type: String },
  gruposDeAtencion: { type: String },
  empresaId: { type: Schema.Types.ObjectId, ref: 'Empresa' },
  alcance: { type: String, enum: ['global', 'local'], default: 'local' },
  plantilla: [{
    campo: { type: String, required: true },
    tipo: { type: String, enum: ['texto', 'numero', 'fecha', 'lista'], default: 'texto' },
    opciones: [String],
    requerido: { type: Boolean, default: false }
  }],
  activo: { type: Boolean, default: true }
});

// Índices para mejorar el rendimiento de las búsquedas
servicioSchema.index({ tipo: 1 });
servicioSchema.index({ categoria: 1 });

export default mongoose.model<IServicio>('Servicio', servicioSchema);