import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import connectDB from './Config/ConectionDB';
import path from 'path';

// Rutas
import authRoutes from './Routes/auth.routes';
import { initLogger } from './common/logger';
import empresasRoutes from './Routes/empresas.routes';
import usuariosRoutes from './Routes/usuarios.routes';
import adminsRoutes from './Routes/admins.routes';
import roleRoutes from './Routes/role.routes';
import habilidadesRoutes from './Routes/habilidades.routes';
import dashboardRoutes from './Routes/dashboard.routes';

// ✅ Cargar variables de entorno solo en desarrollo
const ENV = process.env.NODE_ENV || 'development';

if (ENV === 'development') {
    const rootEnvPath = path.resolve(__dirname, '../../../.env');
    const localEnvPath = path.resolve(__dirname, '../.env');

    dotenv.config({ path: rootEnvPath });
    dotenv.config({ path: localEnvPath });

    console.log(`[${ENV}] 📄 Cargando variables desde archivos .env`);
}

console.log(`[${ENV}] 🌍 Entorno detectado`);

// Inicializar logger según rama
initLogger();

async function main() {
    // Inicialización del servidor
    const app: Application = express();
    const PORT = process.env.USUARIOS_PORT || 3001;

    // Middlewares globales
    app.use(express.json());
    // CORS manejado por el Gateway, no agregar aquí
    // Conexión a MongoDB
    await connectDB();

    // Montar Rutas
    app.use('/auth', authRoutes);
    app.use('/empresas', empresasRoutes);
    app.use('/usuarios', usuariosRoutes);
    app.use('/admins', adminsRoutes);
    app.use('/roles', roleRoutes);
    app.use('/habilidades', habilidadesRoutes);
    app.use('/usuarios', dashboardRoutes);

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