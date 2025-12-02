import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Cargar el .env desde AURONTEK/.env
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
      console.log('Mongoose desconectado de MongoDB');
    });

    // Intentar conexión
    await mongoose.connect(process.env.MONGODB_URI as string, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 2000,
      family: 4,
      maxPoolSize: 10
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

    // Verificar y crear colección de mensajes si no existe
    if (!collectionNames.includes('mensajes')) {
      console.log('Creando colección de mensajes...');
      await db.createCollection('mensajes');
      await db.collection('mensajes').createIndex({ ticketId: 1 });
      await db.collection('mensajes').createIndex({ empresaId: 1 });
    }
  } catch (error) {
    console.error('Error al inicializar colecciones:', error);
    throw error;
  }
};

export default connectDB;
export { isConnected };