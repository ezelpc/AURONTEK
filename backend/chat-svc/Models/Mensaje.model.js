import mongoose from 'mongoose';

const mensajeSchema = new mongoose.Schema({
    ticketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
        required: true,
        index: true
    },
    empresaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Empresa',
        required: true
    },
    emisorId: {
        type: mongoose.Schema.Types.ObjectId,
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
        usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
        fecha: { type: Date, default: Date.now }
    }],
    metadata: {
        type: Map,
        of: String
    }
}, {
    timestamps: true
});

const Mensaje = mongoose.model('Mensaje', mensajeSchema);
export default Mensaje;