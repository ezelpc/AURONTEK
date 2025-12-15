import app from './app';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Carga las variables de entorno de forma consistente
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const PORT = process.env.TICKETS_PORT || 3002;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('FATAL ERROR: La variable de entorno MONGODB_URI no está definida.');
  process.exit(1);
}

const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');
    app.listen(PORT, () => console.log(`🚀 Servidor corriendo en el puerto ${PORT}`));
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error);
    process.exit(1);
  }
};

startServer();