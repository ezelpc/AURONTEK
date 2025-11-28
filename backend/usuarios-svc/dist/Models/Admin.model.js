"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
const adminSchema = new Schema({
    nombre: { type: String, required: true },
    correo: { type: String, required: true, unique: true },
    contraseña: { type: String, required: true },
    telefono: { type: String },
    puesto: { type: String },
    activo: { type: Boolean, default: true },
    rol: { type: String, default: 'admin-general' },
    creado: { type: Date, default: Date.now }
}, {
    collection: 'admins' // <--- ESTO CONECTA CON TU BASE DE DATOS REAL
});
exports.default = mongoose_1.default.model('Admin', adminSchema);
