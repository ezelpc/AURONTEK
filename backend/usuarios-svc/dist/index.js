"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// index.ts
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const ConectionDB_1 = __importDefault(require("./Config/ConectionDB"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
// Rutas
const auth_routes_1 = __importDefault(require("./Routes/auth.routes"));
const empresas_routes_1 = __importDefault(require("./Routes/empresas.routes"));
const usuarios_routes_1 = __importDefault(require("./Routes/usuarios.routes"));
// ================================
// 🔹 Configuración de rutas absolutas
// ================================
// Cargar .env desde nivel superior
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
// ================================
// 🔹 Inicialización del servidor
// ================================
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// ================================
// 🔹 Conexión a MongoDB y arranque
// ================================
const startServer = async () => {
    try {
        await (0, ConectionDB_1.default)();
        // ================================
        // 🔹 Montar rutas
        // ================================
        app.use('/auth', auth_routes_1.default);
        app.use('/empresas', empresas_routes_1.default);
        app.use('/usuarios', usuarios_routes_1.default);
        // ================================
        // 🔹 Iniciar servidor
        // ================================
        app.listen(PORT, () => {
            console.log(`✅ Usuarios-SVC escuchando en el puerto ${PORT}`);
            console.log(`📂 Ruta del proyecto: ${__dirname}`);
        });
    }
    catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
    }
};
startServer();
