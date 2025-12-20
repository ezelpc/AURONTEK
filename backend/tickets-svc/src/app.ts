import express, { Application } from 'express';
import serviceRoutes from './Routes/service.routes';
import ticketRoutes from './Routes/ticket.routes';

const app: Application = express();

// Middlewares
// CORS manejado por el Gateway, no agregar aquí
app.use(express.json()); // Permite al servidor entender JSON en los bodies de las peticiones
import path from 'path';
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// API Routes
// El gateway ya agrega el prefijo /api, así que aquí solo usamos /services y /tickets
app.use('/services', serviceRoutes);
app.use('/tickets', ticketRoutes);

// Ruta de health-check para verificar que el servidor está vivo
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

export default app;