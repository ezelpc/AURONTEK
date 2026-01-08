import mongoose from 'mongoose';
import Servicio from './Models/Servicio';
import Ticket from './Models/Ticket.model';
import dotenv from 'dotenv';
import path from 'path';
import ticketService from './Services/ticket.service';
import axios from 'axios';

// --- MOCKING WITHOUT JEST ---
// Monkey-patch console.error to suppress expected connection errors if any
const originalError = console.error;

// Load env
const ENV = process.env.NODE_ENV || 'development';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aurontek';

if (ENV === 'development') {
    const rootEnvPath = path.resolve(__dirname, '../../../.env');
    const localEnvPath = path.resolve(__dirname, '../.env');
    dotenv.config({ path: rootEnvPath });
    dotenv.config({ path: localEnvPath });
}

// Monkey-patch axios.get
(axios.get as any) = async (url: string) => {
    console.log(`[MOCK-AXIOS] Calling ${url}`);

    // Return dummy users that match our seed
    const mockUsers = [
        { _id: '507f1f77bcf86cd799439011', nombre: 'Agente Mesa', rol: 'soporte', gruposDeAtencion: ['Mesa de Servicio'] },
        { _id: '507f1f77bcf86cd799439012', nombre: 'Agente TI', rol: 'soporte', gruposDeAtencion: ['Soporte Ti'] }
    ];
    return { data: mockUsers };
};

// Monkey-patch publicarEvento to avoid RabbitMQ connection
(ticketService as any).publicarEvento = async (topic: string, msg: any) => {
    console.log(`[MOCK-RABBITMQ] Would publish to ${topic}:`, JSON.stringify(msg));
    return true;
};

const verify = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log(`✅ Connected to ${MONGODB_URI}`);

        // 1. Get Service from DB
        const service = await Servicio.findOne({ nombre: 'Soporte General PC' });
        if (!service) throw new Error('Service not found. Run seed_services.ts first.');
        console.log(`👉 Testing with service: ${service.nombre} (Group: ${service.gruposDeAtencion})`);

        // 2. Create Ticket
        const empresaId = new mongoose.Types.ObjectId('6942f22afad205160277e1ff');
        const usuarioId = new mongoose.Types.ObjectId('6942f22afad205160277e200');

        console.log('🚀 Creating ticket...');

        // We call creatingTicket. It will internally call "asignarAutomaticamente"
        // "asignarAutomaticamente" will call our mocked axios.get
        // "crearTicket" will call our mocked publicarEvento

        const newTicket = await ticketService.crearTicket({
            titulo: 'Test Ticket Auto Assign',
            descripcion: 'Validation of auto-assignment logic',
            empresaId: empresaId,
            usuarioCreador: usuarioId,
            servicioId: service._id,
            prioridad: 'media',
            tipo: 'requerimiento',
            categoria: service.categoria,
            origen: 'web' // 'web' is default
            // fields like 'usuarioCreadorEmail' might be needed if service uses them, 
            // but for assignment it uses IDs
        });

        console.log(`✅ Ticket created: ${newTicket._id}`);
        console.log(`   Initial State: ${newTicket.estado}`);

        // 3. Verify Assignment
        // Re-fetch to be absolutely sure of persistence
        const ticket = await Ticket.findById(newTicket._id);
        const assignedId = ticket?.agenteAsignado?.toString();

        console.log(`\n🔍 VERIFICATION RESULT:`);
        if (assignedId) {
            // In our mock users, 507f1f77bcf86cd799439011 is 'Agente Mesa' who handles 'Mesa de Servicio'
            // The service 'Soporte General PC' is handled by 'Mesa de Servicio'
            if (assignedId === '507f1f77bcf86cd799439011') {
                console.log(`🎉 SUCCESS! Assigned correctly to Agente Mesa (${assignedId})`);
            } else {
                console.log(`⚠️ ASSIGNED, but to unexpected ID: ${assignedId}`);
            }
        } else {
            console.error('❌ FAILURE! Ticket was NOT assigned automatically.');
        }

        process.exit(0);

    } catch (e: any) {
        console.error('❌ Error during verification:', e.message);
        console.error(e);
        process.exit(1);
    }
};

verify();
