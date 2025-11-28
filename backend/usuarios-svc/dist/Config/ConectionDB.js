"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// ✅ Cargar el .env desde un nivel superior
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const connectDB = async () => {
    try {
        // Corrección: Usamos MONGODB_URI en lugar de MONGO_URI
        await mongoose_1.default.connect(process.env.MONGODB_URI || '', {
        // useNewUrlParser and useUnifiedTopology are deprecated in newer mongoose versions but kept for compatibility if needed
        // If using Mongoose 6+, these options are default.
        });
        console.log('🎉 MongoDB conexion exitosa');
    }
    catch (error) {
        console.error('❌ MongoDB error de conexion :', error);
        process.exit(1);
    }
};
exports.default = connectDB;
