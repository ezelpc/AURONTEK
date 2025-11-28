"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generarCodigoAcceso = void 0;
/**
 * Genera un código de acceso alfanumérico único.
 * @param {number} length - Longitud del código.
 * @returns {string} - El código generado.
 */
const generarCodigoAcceso = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
exports.generarCodigoAcceso = generarCodigoAcceso;
