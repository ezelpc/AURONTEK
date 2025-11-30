import dotenv from 'dotenv';
import express from 'express';
import connectDB from './Config/ConectionDB.js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
// Importar rutas
import ticketRoutes from './Routes/ticket.routes.js';
// Configuración de rutas absolutas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Cargar el .env desde un nivel superior
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// Inicialización del servidor
const app = express();
const PORT = process.env.PORT || 3002;
// Middlewares globales
app.use(cors());
app.use(express.json());
// Conexión a MongoDB
await connectDB();
// Montar Rutas
app.use('/tickets', ticketRoutes);
// Healthcheck
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Iniciar servidor
app.listen(PORT, () => {
    console.log(`✅ Tickets-SVC escuchando en el puerto ${PORT}`);
});
