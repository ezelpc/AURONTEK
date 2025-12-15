import express, { Application } from 'express';
import cors from 'cors';
import serviceRoutes from './Routes/service.routes';
import ticketRoutes from './Routes/ticket.routes';

const app: Application = express();

// Middlewares
app.use(cors()); // Habilita CORS para todas las rutas
app.use(express.json()); // Permite al servidor entender JSON en los bodies de las peticiones

// API Routes
// El gateway ya agrega el prefijo /api, así que aquí solo usamos /services y /tickets
app.use('/services', serviceRoutes);
app.use('/tickets', ticketRoutes);

// Ruta de health-check para verificar que el servidor está vivo
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

export default app;