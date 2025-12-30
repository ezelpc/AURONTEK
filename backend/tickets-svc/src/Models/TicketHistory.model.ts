import mongoose, { Document, Schema } from 'mongoose';

// Interface para TypeScript
export interface ITicketHistory extends Document {
    ticketId: mongoose.Types.ObjectId;
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
    metadata?: {
        ip?: string;
        userAgent?: string;
        [key: string]: any;
    };
    createdAt?: Date;
}

const ticketHistorySchema = new Schema<ITicketHistory>({
    ticketId: {
        type: Schema.Types.ObjectId,
        ref: 'Ticket',
        required: true,
        index: true
    },
    tipo: {
        type: String,
        enum: ['status_change', 'assignment', 'priority_change', 'comment', 'update', 'creation', 'deletion'],
        required: true
    },
    usuarioId: {
        type: String, // String to allow 'sistema' or ObjectId strings
        required: true
    },
    usuarioNombre: {
        type: String,
        required: true
    },
    usuarioCorreo: {
        type: String,
        required: true
    },
    cambios: [{
        campo: { type: String, required: true },
        valorAnterior: Schema.Types.Mixed,
        valorNuevo: Schema.Types.Mixed
    }],
    comentario: String,
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    collection: 'ticket_history',
    timestamps: true
});

// Índices para mejorar el rendimiento de consultas
ticketHistorySchema.index({ ticketId: 1, createdAt: -1 });
ticketHistorySchema.index({ usuarioId: 1, createdAt: -1 });
ticketHistorySchema.index({ tipo: 1, createdAt: -1 });

const TicketHistory = mongoose.models.TicketHistory || mongoose.model<ITicketHistory>('TicketHistory', ticketHistorySchema);

export default TicketHistory;
