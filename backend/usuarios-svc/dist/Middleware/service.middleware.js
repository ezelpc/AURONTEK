"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUserOrService = exports.validateServiceToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Middleware para validar tokens de comunicación entre servicios
 */
const validateServiceToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const serviceName = req.headers['x-service-name'];
    const serviceToken = process.env.SERVICE_TOKEN;
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    if (token === serviceToken && serviceName) {
        req.isServiceCall = true;
        req.serviceName = Array.isArray(serviceName) ? serviceName[0] : serviceName;
        console.log(`✅ Llamada de servicio autorizada: ${req.serviceName}`);
        return next();
    }
    return res.status(403).json({
        msg: 'Acceso denegado: Token de servicio inválido'
    });
};
exports.validateServiceToken = validateServiceToken;
/**
 * Middleware que permite tanto usuarios autenticados como servicios
 */
const validateUserOrService = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const serviceName = req.headers['x-service-name'];
    const serviceToken = process.env.SERVICE_TOKEN;
    if (!authHeader) {
        return res.status(401).json({ msg: 'Token no proporcionado' });
    }
    const token = authHeader.replace('Bearer ', '');
    // Verificar si es un token de servicio
    if (token === serviceToken && serviceName) {
        req.isServiceCall = true;
        req.serviceName = Array.isArray(serviceName) ? serviceName[0] : serviceName;
        return next();
    }
    // Si no es servicio, validar como JWT de usuario
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        req.usuario = decoded;
        req.isServiceCall = false;
        next();
    }
    catch (error) {
        return res.status(401).json({ msg: 'Token inválido' });
    }
};
exports.validateUserOrService = validateUserOrService;
exports.default = {
    validateServiceToken: exports.validateServiceToken,
    validateUserOrService: exports.validateUserOrService
};
