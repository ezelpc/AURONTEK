import mongoose, { Schema } from 'mongoose';

// Simple stub schema to allow populate to work cross-service (shared DB)
const UsuarioStubSchema = new Schema({
    nombre: String,
    rol: String,
    fotoPerfil: String,
    email: String
}, {
    collection: 'usuarios', // Ensure we map to the correct collection
    strict: false
});

// Register the model if not exists to avoid OverwriteModelError
const Usuario = mongoose.models.Usuario || mongoose.model('Usuario', UsuarioStubSchema);
export default Usuario;
