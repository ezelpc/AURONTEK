import dotenv from 'dotenv';
import express, { Request, Response, Application } from 'express';
import connectDB from './Config/ConectionDB';
import cors from 'cors';
import path from 'path';

// Rutas
import authRoutes from './Routes/auth.routes';
import { initLogger } from './common/logger';
import empresasRoutes from './Routes/empresas.routes';
import usuariosRoutes from './Routes/usuarios.routes';

// Cargar el .env desde AURONTEK/.env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Inicializar logger según rama
initLogger();

async function main() {
    // Inicialización del servidor
    const app: Application = express();
    const PORT = process.env.USUARIOS_PORT || 3001;

    // Middlewares globales
    app.use(cors());
    app.use(express.json());

    // Conexión a MongoDB
    await connectDB();

    // Montar Rutas
    app.use('/auth', authRoutes);
    app.use('/empresas', empresasRoutes);
    app.use('/usuarios', usuariosRoutes);

    // Healthcheck
    app.get('/health', (req: Request, res: Response) => {
        res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    // Iniciar servidor
    app.listen(PORT, () => {
        console.log(`✅ Usuarios-SVC escuchando en el puerto ${PORT}`);
        console.log(`📂 Ruta del proyecto: ${__dirname}`);
    });
}

main().catch(error => {
    console.error('❌ Error al iniciar usuarios-svc:', error);
    process.exit(1);
});