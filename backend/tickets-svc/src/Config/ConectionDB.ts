import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar el .env desde AURONTEK/.env (2 niveles arriba: src -> Config -> backend -> AURONTEK)
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const connectDB = async (): Promise<void> => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        await mongoose.connect(mongoUri);
        console.log('MongoDB conexion exitosa');

    } catch (error) {
        console.error('MongoDB error de conexion :', error);
        process.exit(1);
    }
};

export default connectDB;
