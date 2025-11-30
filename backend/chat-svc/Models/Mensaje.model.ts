import mongoose, { Document, Schema } from 'mongoose';

export interface IMensaje extends Document {
    ticketId: mongoose.Types.ObjectId;
    empresaId: mongoose.Types.ObjectId;
    emisorId: mongoose.Types.ObjectId;
    tipo: 'texto' | 'imagen' | 'archivo' | 'sistema';
    contenido: string;
    leidoPor: Array<{
        usuarioId: mongoose.Types.ObjectId;
        fecha: Date;
    }>;
    metadata?: Map<string, string>;
    createdAt?: Date;
    updatedAt?: Date;
}

const mensajeSchema = new Schema<IMensaje>({
    ticketId: {
        type: Schema.Types.ObjectId,
        ref: 'Ticket',
        required: true,
        index: true
    },
    empresaId: {
        type: Schema.Types.ObjectId,
        ref: 'Empresa',
        required: true
    },
    emisorId: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    tipo: {
        type: String,
        enum: ['texto', 'imagen', 'archivo', 'sistema'],
        default: 'texto'
    },
    contenido: {
        type: String,
        required: true
    },
    leidoPor: [{
        usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario' },
        fecha: { type: Date, default: Date.now }
    }],
    metadata: {
        type: Map,
        of: String
    }
}, {
    timestamps: true
});

const Mensaje = mongoose.model<IMensaje>('Mensaje', mensajeSchema);
export default Mensaje;