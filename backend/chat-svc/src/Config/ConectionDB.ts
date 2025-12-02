import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar el .env desde AURONTEK/.env (2 niveles arriba: src -> Config -> backend -> AURONTEK)
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

let isConnected = false;

const connectDB = async (): Promise<void> => {
  if (isConnected) {
    console.log('Ya estamos conectados a MongoDB');
    return;
  }

  try {
    // Habilitar debug de Mongoose para desarrollo
    mongoose.set('debug', process.env.NODE_ENV !== 'production');
    
    // Configurar eventos de conexión
    mongoose.connection.on('connected', () => {
      isConnected = true;
      console.log('Mongoose conectado a MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      isConnected = false;
      console.error('Error de conexión Mongoose:', err);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.log(' Mongoose desconectado de MongoDB');
    });

    // Intentar conexión
    await mongoose.connect(process.env.MONGODB_URI as string, {
      serverSelectionTimeoutMS: 30000,    // 30 segundos
      socketTimeoutMS: 45000,             // 45 segundos
      heartbeatFrequencyMS: 2000,         // Latido cada 2 segundos
      family: 4,                          // Forzar IPv4
      maxPoolSize: 10                     // Límite de conexiones simultáneas
    });

    // Verificar conexión
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      console.log('¡Conexión exitosa a MongoDB! Base de datos:', mongoose.connection.name);
    }
    
    isConnected = true;

    // Verificar y configurar las colecciones necesarias
    await initializeCollections();

  } catch(error) {
    isConnected = false;
    console.error('Error de conexión a MongoDB:', error);
    
    // Intentar reconectar en caso de error
    setTimeout(() => {
      console.log('Intentando reconectar a MongoDB...');
      connectDB();
    }, 5000);
  }
};

const initializeCollections = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) return;
    
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    // Verificar y crear colección de usuarios si existe
    if (!collectionNames.includes('usuarios')) {
      console.log('Creando colección de usuarios...');
      await db.createCollection('usuarios');
      await db.collection('usuarios').createIndex({ correo: 1 }, { unique: true });
    }

    // Verificar y crear colección de admins si no existe
    if (!collectionNames.includes('admins')) {
      console.log('Creando colección de admins...');
      await db.createCollection('admins');
      await db.collection('admins').createIndex({ correo: 1 }, { unique: true });
    }
  } catch (error) {
    console.error('Error al inicializar colecciones:', error);
    throw error;
  }
};

// Exportar un objeto con todas las funciones relacionadas con la base de datos
export default connectDB;
export { isConnected };
