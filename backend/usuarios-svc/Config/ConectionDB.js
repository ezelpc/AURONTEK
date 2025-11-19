// src/config/ConectioDB.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Cargar el .env desde un nivel superior
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectDB = async () => {
    try {
        // Corrección: Usamos MONGODB_URI en lugar de MONGO_URI
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }); 
        console.log('🎉 MongoDB conexion exitosa');
    } catch (error) {
        console.error('❌ MongoDB error de conexion :', error);
        process.exit(1);
    }
};
export default connectDB;