"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificarRecaptcha = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Verifica el token de reCAPTCHA con Google
 * @param {string} token - Token de respuesta de reCAPTCHA
 * @returns {Promise<boolean>} - true si es válido, false si no
 */
const verificarRecaptcha = async (token) => {
    try {
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        if (!secretKey) {
            throw new Error('RECAPTCHA_SECRET_KEY no está configurada');
        }
        const url = 'https://www.google.com/recaptcha/api/siteverify';
        const params = new URLSearchParams();
        params.append('secret', secretKey);
        params.append('response', token);
        const response = await axios_1.default.post(url, params);
        if (!response.data.success) {
            console.log('Error de reCAPTCHA:', response.data['error-codes']);
            return false;
        }
        return true;
    }
    catch (error) {
        console.error('Error al verificar reCAPTCHA:', error.message);
        return false;
    }
};
exports.verificarRecaptcha = verificarRecaptcha;
exports.default = { verificarRecaptcha: exports.verificarRecaptcha };
