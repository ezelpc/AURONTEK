import mongoose from 'mongoose';
const { Schema } = mongoose;

const adminSchema = new Schema({
  nombre: { type: String, required: true },
  correo: { type: String, required: true, unique: true },
  contraseña: { type: String, required: true },
  telefono: { type: String },
  puesto: { type: String },
  activo: { type: Boolean, default: true },
  rol: { type: String, default: 'admin-general' },
  creado: { type: Date, default: Date.now }
}, { 
  collection: 'admins' // <--- ESTO CONECTA CON TU BASE DE DATOS REAL
});

export default mongoose.model('Admin', adminSchema);