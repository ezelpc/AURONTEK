import mongoose, { Schema, Document } from 'mongoose';

export interface INotificacion extends Document {
    usuarioId: string;
    titulo: string;
    mensaje: string;
    tipo: 'info' | 'success' | 'warning' | 'error';
    leida: boolean;
    metadata?: any;
    createdAt: Date;
}

const notificacionSchema: Schema = new Schema({
    usuarioId: { type: String, required: true, index: true }, // ID del usuario destinatario
    titulo: { type: String, required: true },
    mensaje: { type: String, required: true },
    tipo: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
    leida: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed }, // Para guardar datos extra como ticketId, enlace, etc.
}, {
    timestamps: true
});

// Índice para listar rápido por usuario y estado
notificacionSchema.index({ usuarioId: 1, leida: 1, createdAt: -1 });

export default mongoose.model<INotificacion>('Notificacion', notificacionSchema);
