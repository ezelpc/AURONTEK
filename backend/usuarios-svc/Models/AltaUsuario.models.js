import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const { Schema } = mongoose;

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
    required: function() { return this.rol !== 'admin-general'; }
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
UsuarioSchema.pre('save', async function(next) {
  if (!this.isModified('contraseña')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.contraseña = await bcrypt.hash(this.contraseña, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 🔐 Comparar contraseñas
UsuarioSchema.methods.compararPassword = async function(passwordIngresada) {
  const usuario = await mongoose.model('Usuario').findById(this._id).select('+contraseña');
  return await bcrypt.compare(passwordIngresada, usuario.contraseña);
};

// ✅ Exportación compatible con `import Usuario from ...`
const Usuario = mongoose.model('Usuario', UsuarioSchema);
export default Usuario;
