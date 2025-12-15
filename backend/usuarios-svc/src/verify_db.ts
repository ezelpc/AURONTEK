import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Habilidad from './Models/Habilidad.model';
import Role from './Models/Role.model';

dotenv.config();

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || '');
        console.log('Connected to:', process.env.MONGODB_URI);
        
        const habilidades = await Habilidad.find({});
        console.log(`Count Habilidades: ${habilidades.length}`);
        console.log('Sample Habilidades:', habilidades.map(h => h.nombre).slice(0, 5));

        const roles = await Role.find({});
        console.log(`Count Roles: ${roles.length}`);
        console.log('Sample Roles:', roles.map(r => r.nombre).slice(0, 5));
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

verify();
