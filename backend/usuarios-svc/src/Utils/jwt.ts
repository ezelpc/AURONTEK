import jwt from 'jsonwebtoken';

/**
 * Genera un token JWT con los datos del usuario.
 * @param {object} payload - Datos a incluir en el token.
 * @returns {string} - Token JWT generado.
 */
export const generarJWT = (payload: any) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
    expiresIn: '8h',
  });
};
