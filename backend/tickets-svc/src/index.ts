// ✅ CRÍTICO: Cargar variables de entorno ANTES de cualquier importación
// Esto asegura que las variables estén disponibles cuando los módulos se inicialicen
import dotenv from 'dotenv';
import path from 'path';

const ENV = process.env.NODE_ENV || 'development';

if (ENV === 'development') {
  const localEnvPath = path.resolve(__dirname, '../.env');
  dotenv.config({ path: localEnvPath });
  console.log(`[${ENV}] 📄 Cargando variables desde .env local`);
}

console.log(`[${ENV}] 🌍 Entorno detectado`);

// Ahora sí, importar el resto de módulos
import app from './app';
import mongoose from 'mongoose';

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