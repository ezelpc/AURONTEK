import jwt from 'jsonwebtoken';

/**
 * Middleware para verificar la validez de un JWT.
 */
export const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ msg: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const decodificado = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decodificado; // { id, rol, empresaId }
    next();
  } catch (error) {
    return res.status(400).json({ msg: 'Token no válido o expirado.' });
  }
};

/**
 * Middleware para verificar si el rol es 'admin-general'.
 * Usar DESPUÉS de verificarToken.
 */
export const esAdminGeneral = (req, res, next) => {
  if (req.usuario.rol !== 'admin-general') {
    return res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de Admin General.' });
  }
  next();
};

/**
 * Middleware para verificar si el rol es 'admin-interno'.
 * Usar DESPUÉS de verificarToken.
 */
export const esAdminInterno = (req, res, next) => {
  if (req.usuario.rol !== 'admin-interno') {
    return res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de Admin Interno.' });
  }
  next();
};

/**
 * Middleware para verificar si el rol es 'soporte'.
 * Usar DESPUÉS de verificarToken.
 */
export const esSoporte = (req, res, next) => {
  if (req.usuario.rol !== 'soporte') {
    return res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de Soporte.' });
  }
  next();
};

export default { verificarToken, esAdminGeneral, esAdminInterno, esSoporte };