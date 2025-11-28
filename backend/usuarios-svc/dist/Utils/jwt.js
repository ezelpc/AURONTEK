"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generarJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Genera un token JWT con los datos del usuario.
 * @param {object} payload - Datos a incluir en el token.
 * @returns {string} - Token JWT generado.
 */
const generarJWT = (payload) => {
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'secret', {
        expiresIn: '8h',
    });
};
exports.generarJWT = generarJWT;
