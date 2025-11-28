"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.esSoporte = exports.esAdminInterno = exports.esAdminGeneral = exports.verificarToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Middleware para verificar la validez de un JWT.
 */
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"
    if (!token) {
        return res.status(401).json({ msg: 'Acceso denegado. Token no proporcionado.' });
    }
    try {
        const decodificado = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        req.usuario = decodificado; // { id, rol, empresaId }
        next();
    }
    catch (error) {
        return res.status(400).json({ msg: 'Token no válido o expirado.' });
    }
};
exports.verificarToken = verificarToken;
/**
 * Middleware para verificar si el rol es 'admin-general'.
 * Usar DESPUÉS de verificarToken.
 */
const esAdminGeneral = (req, res, next) => {
    if (req.usuario.rol !== 'admin-general') {
        return res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de Admin General.' });
    }
    next();
};
exports.esAdminGeneral = esAdminGeneral;
/**
 * Middleware para verificar si el rol es 'admin-interno'.
 * Usar DESPUÉS de verificarToken.
 */
const esAdminInterno = (req, res, next) => {
    if (req.usuario.rol !== 'admin-interno') {
        return res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de Admin Interno.' });
    }
    next();
};
exports.esAdminInterno = esAdminInterno;
/**
 * Middleware para verificar si el rol es 'soporte'.
 * Usar DESPUÉS de verificarToken.
 */
const esSoporte = (req, res, next) => {
    if (req.usuario.rol !== 'soporte') {
        return res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de Soporte.' });
    }
    next();
};
exports.esSoporte = esSoporte;
exports.default = { verificarToken: exports.verificarToken, esAdminGeneral: exports.esAdminGeneral, esAdminInterno: exports.esAdminInterno, esSoporte: exports.esSoporte };
