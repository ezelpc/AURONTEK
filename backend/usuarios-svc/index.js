// index.js
import dotenv from 'dotenv';
import express from 'express';
import connectDB from './Config/ConectionDB.js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Rutas
import authRoutes from './Routes/auth.routes.js';
import empresasRoutes from './Routes/empresas.routes.js';
import usuariosRoutes from './Routes/usuarios.routes.js';

// ================================
// 🔹 Configuración de rutas absolutas
// ================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
// 🔹 Conexión a MongoDB
// ================================
await connectDB();

// ================================
// 🔹 Montar rutas
// ================================
app.use('/auth', authRoutes);
app.use('/empresas', empresasRoutes);
app.use('/usuarios', usuariosRoutes);

// ================================
// 🔹 Iniciar servidor
// ================================
app.listen(PORT, () => {
  console.log(`✅ Usuarios-SVC escuchando en el puerto ${PORT}`);
  console.log(`📂 Ruta del proyecto: ${__dirname}`);
});
