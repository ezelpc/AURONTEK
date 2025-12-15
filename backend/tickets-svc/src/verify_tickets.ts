
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Ticket from './Models/Ticket.model';


// Load Env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const verify = async () => {
  try {
    const mongoUri = process.env.MONGO_URI_TICKETS || process.env.MONGO_URI || 'mongodb://localhost:27017/tickets_db';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to Mongo.');

    const totalTickets = await Ticket.countDocuments({});
    console.log('Total Tickets in DB:', totalTickets);

    const tickets = await Ticket.find({});
    console.log('Sample Tickets (up to 3):', JSON.stringify(tickets.slice(0, 3), null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

verify();
