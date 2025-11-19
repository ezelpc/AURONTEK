import jwt from 'jsonwebtoken';

/**
 * Genera un token JWT con un tiempo de expiración de 8 horas.
 * @param {object} payload - Datos a incluir en el token.
 * @returns {string} - Token JWT generado.
 */
export const generarJWT = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '8h',
  });
};
