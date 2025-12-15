import mongoose, { Schema, Document } from 'mongoose';

export interface IHabilidad extends Document {
    nombre: string;
    descripcion?: string;
    activo: boolean;
    creado: Date;
    empresa?: string; // Optional: Si queremos habilidades privadas por empresa
}

const HabilidadSchema = new Schema({
    nombre: { type: String, required: true, unique: true }, // Unique names for simplicity? Or unique per company.
    descripcion: { type: String },
    activo: { type: Boolean, default: true },
    empresa: { type: Schema.Types.ObjectId, ref: 'Empresa', default: null } // Null = Global Skill
}, {
    timestamps: { createdAt: 'creado', updatedAt: 'actualizado' }
});

export default mongoose.model<IHabilidad>('Habilidad', HabilidadSchema);
