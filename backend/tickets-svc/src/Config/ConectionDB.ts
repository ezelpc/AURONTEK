import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// ✅ Cargar variables de entorno solo en desarrollo
const ENV = process.env.NODE_ENV || 'development';

if (ENV === 'development') {
    const localEnvPath = path.resolve(__dirname, '../../.env');
    dotenv.config({ path: localEnvPath });
    console.log(`[${ENV}] 🔍 Cargando .env desde:`, localEnvPath);
}

console.log(`[${ENV}] 🔍 MONGODB_URI:`, process.env.MONGODB_URI ? '✅ Configurada' : '❌ NO DEFINIDA');
console.log(`[${ENV}] 🔍 RABBITMQ_URL:`, process.env.RABBITMQ_URL ? '✅ Configurada' : '❌ NO DEFINIDA');


const connectDB = async (): Promise<void> => {
    try {
        const mongoUri = process.env.MONGODB_URI;

        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        await mongoose.connect(mongoUri);
        console.log('MongoDB conexión exitosa');

    } catch (error) {
        console.error('MongoDB error de conexión:', error);
        process.exit(1);
    }
};

export default connectDB;
