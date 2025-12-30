
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Servicio from '../Models/Servicio';

dotenv.config();

const migrateServices = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aurontek_db';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // 1. Update PLATAFORMA -> global
        const globalResult = await Servicio.updateMany(
            { alcance: 'PLATAFORMA' },
            { $set: { alcance: 'global' } }
        );
        console.log(`Updated ${globalResult.modifiedCount} services from PLATAFORMA to global`);

        // 2. Update INTERNO -> local
        // Note: These might remain orphaned (no empresaId) unless we assign them to AurontekHQ or leave them hidden
        const localResult = await Servicio.updateMany(
            { alcance: 'INTERNO' },
            { $set: { alcance: 'local' } }
        );
        console.log(`Updated ${localResult.modifiedCount} services from INTERNO to local`);

        // 3. Update CLIENTE -> local (Just in case)
        const clienteResult = await Servicio.updateMany(
            { alcance: 'CLIENTE' },
            { $set: { alcance: 'local' } }
        );
        console.log(`Updated ${clienteResult.modifiedCount} services from CLIENTE to local`);

        console.log('Migration complete');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateServices();
