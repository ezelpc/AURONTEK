import mongoSanitize from 'express-mongo-sanitize';
import validator from 'validator';

/**
 * Middleware para prevenir NoSQL injection
 * Reemplaza caracteres especiales de MongoDB ($, .) con _
 */
export const sanitizeMiddleware = mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`⚠️  [SECURITY] NoSQL injection attempt detected: ${key} from IP: ${req.ip}`);
    }
});

/**
 * Sanitiza y valida un email
 * @param email - Email a validar
 * @returns Email normalizado y seguro
 * @throws Error si el email es inválido
 */
export const sanitizeEmail = (email: string): string => {
    if (!email || typeof email !== 'string') {
        throw new Error('Email inválido');
    }

    // Validar formato de email
    if (!validator.isEmail(email)) {
        throw new Error('Formato de email inválido');
    }

    // Normalizar email (lowercase, trim, etc.)
    const normalized = validator.normalizeEmail(email, {
        gmail_remove_dots: false,
        gmail_remove_subaddress: false,
        outlookdotcom_remove_subaddress: false,
        yahoo_remove_subaddress: false,
        icloud_remove_subaddress: false
    });

    return normalized || email.toLowerCase().trim();
};

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param str - String a escapar
 * @returns String seguro sin HTML
 */
export const sanitizeString = (str: string): string => {
    if (!str || typeof str !== 'string') {
        return '';
    }
    return validator.escape(str.trim());
};

/**
 * Valida que un string solo contenga caracteres alfanuméricos y algunos especiales seguros
 * @param str - String a validar
 * @param allowSpaces - Permitir espacios
 * @returns true si es válido
 */
export const isAlphanumericSafe = (str: string, allowSpaces: boolean = true): boolean => {
    const pattern = allowSpaces
        ? /^[a-zA-Z0-9\s\-_\.@]+$/
        : /^[a-zA-Z0-9\-_\.@]+$/;
    return pattern.test(str);
};

/**
 * Sanitiza un código de acceso (solo alfanumérico)
 * @param code - Código a sanitizar
 * @returns Código seguro en mayúsculas
 */
export const sanitizeAccessCode = (code: string): string => {
    if (!code || typeof code !== 'string') {
        throw new Error('Código de acceso inválido');
    }

    const cleaned = code.trim().toUpperCase();

    // Solo permitir alfanuméricos
    if (!/^[A-Z0-9]+$/.test(cleaned)) {
        throw new Error('Código de acceso contiene caracteres inválidos');
    }

    return cleaned;
};
