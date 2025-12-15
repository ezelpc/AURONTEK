import mongoose from 'mongoose';
const { Schema } = mongoose;

const roleSchema = new Schema({
    nombre: { type: String, required: true },
    slug: { type: String, required: true }, // unique index will be compound with empresa
    descripcion: { type: String },

    // Null for Global Roles (Aurontek HQ System Roles)
    // Specific ID for Company Roles
    empresa: { type: Schema.Types.ObjectId, ref: 'Empresa', default: null },

    permisos: [{ type: String }], // Array of permission strings

    nivel: { type: Number, required: true, default: 10 },
    // 100: Root/Subroot, 50: Admin Interno, 20: Support, 10: User

    activo: { type: Boolean, default: true },
    creadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario' } // or Admin
}, {
    timestamps: { createdAt: 'creado', updatedAt: 'actualizado' },
    collection: 'roles'
});

// Ensure Role Names are unique per Company
roleSchema.index({ nombre: 1, empresa: 1 }, { unique: true });
roleSchema.index({ slug: 1, empresa: 1 }, { unique: true });

export default mongoose.model('Role', roleSchema);
