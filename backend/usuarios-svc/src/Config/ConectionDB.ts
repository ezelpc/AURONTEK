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

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI no está definida en el archivo .env');
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🎉 MongoDB conexion exitosa');
    } catch (error: any) {
        console.error('❌ MongoDB error de conexion :', error);
        process.exit(1);
    }
};
export default connectDB;