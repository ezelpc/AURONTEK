"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const { Schema } = mongoose_1.default;
const UsuarioSchema = new Schema({
    nombre: { type: String, required: true },
    correo: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: {
            unique: true,
            collation: { locale: 'es', strength: 2 } // Insensible a mayúsculas
        }
    },
    contraseña: { type: String, required: true, select: false },
    telefono: { type: String },
    puesto: { type: String },
    activo: { type: Boolean, default: true },
    rol: {
        type: String,
        enum: ['admin-general', 'admin-interno', 'soporte', 'usuario', 'beca-soporte'],
        required: true
    },
    empresa: {
        type: Schema.Types.ObjectId,
        ref: 'Empresa',
        required: function () { return this.rol !== 'admin-general'; }
    },
    habilidades: [{ type: String }],
    fotoPerfil: { type: String, default: null }
}, {
    timestamps: {
        createdAt: 'creado',
        updatedAt: 'actualizado'
    }
});
// 🔒 Hash de contraseña antes de guardar
UsuarioSchema.pre('save', async function (next) {
    if (!this.isModified('contraseña'))
        return next();
    try {
        const salt = await bcrypt_1.default.genSalt(10);
        this.contraseña = await bcrypt_1.default.hash(this.contraseña, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
// 🔐 Comparar contraseñas
UsuarioSchema.methods.compararPassword = async function (passwordIngresada) {
    const usuario = await mongoose_1.default.model('Usuario').findById(this._id).select('+contraseña');
    return await bcrypt_1.default.compare(passwordIngresada, usuario.contraseña);
};
// ✅ Exportación compatible con `import Usuario from ...`
const Usuario = mongoose_1.default.model('Usuario', UsuarioSchema);
exports.default = Usuario;
