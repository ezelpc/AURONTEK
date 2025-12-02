import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// ✅ Cargar el .env desde la raíz del proyecto (AURONTEK/.env)
// __dirname en ts-node apunta a src/Config
// ../../../../.env llega a AURONTEK/.env (src -> Config -> usuarios-svc -> backend -> AURONTEK)
const envPath = path.resolve(__dirname, '../../../../.env');
dotenv.config({ path: envPath });

console.log('🔍 Intentando cargar .env desde:', envPath);
console.log('🔍 MONGODB_URI cargada:', process.env.MONGODB_URI ? '*****' : 'NO DEFINIDA');

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