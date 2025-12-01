// index.ts
import dotenv from 'dotenv';
import express from 'express';
import connectDB from './Config/ConectionDB';
import cors from 'cors';
import path from 'path';

// Rutas
import authRoutes from './Routes/auth.routes';
import { initLogger } from '../../common/logger';
import empresasRoutes from './Routes/empresas.routes';
import usuariosRoutes from './Routes/usuarios.routes';

// ================================
// 🔹 Configuración de rutas absolutas
// ================================
// Cargar .env desde nivel superior
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ================================
// 🔹 Inicialización del servidor
// ================================
const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// ================================
// 🔹 Conexión a MongoDB y arranque
// ================================
const startServer = async () => {
  try {
    await connectDB();

    // ================================
    // 🔹 Montar rutas
    // ================================
    app.use('/auth', authRoutes);

    // Inicializar logger lo más pronto posible en este servicio
    initLogger();
    app.use('/empresas', empresasRoutes);
    app.use('/usuarios', usuariosRoutes);

    // ================================
    // 🔹 Iniciar servidor
    // ================================
    app.listen(PORT, () => {
      console.log(`✅ Usuarios-SVC escuchando en el puerto ${PORT}`);
      console.log(`📂 Ruta del proyecto: ${__dirname}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
  }
};

startServer();
