import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// __dirname y __filename ya existen en CommonJS, no uses import.meta.url
// Solo hay que resolver la ruta al .env

// Cargar .env desde AURONTEK/.env
dotenv.config({
    path: path.resolve(__dirname, '../../../../.env')
});

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
