// usuarios-svc/Middleware/service.middleware.js
import jwt from 'jsonwebtoken';

/**
 * Middleware para validar tokens de comunicación entre servicios
 */
export const validateServiceToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const serviceName = req.headers['x-service-name'];
  const serviceToken = process.env.SERVICE_TOKEN;

  const token = authHeader ? authHeader.replace('Bearer ', '') : null;

  if (token === serviceToken && serviceName) {
    req.isServiceCall = true;
    req.serviceName = serviceName;
    console.log(`✅ Llamada de servicio autorizada: ${serviceName}`);
    return next();
  }

  return res.status(403).json({ 
    msg: 'Acceso denegado: Token de servicio inválido' 
  });
};

/**
 * Middleware que permite tanto usuarios autenticados como servicios
 */
export const validateUserOrService = (req, res, next) => {
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
    req.serviceName = serviceName;
    return next();
  }

  // Si no es servicio, validar como JWT de usuario
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    req.isServiceCall = false;
    next();
  } catch (error) {
    return res.status(401).json({ msg: 'Token inválido' });
  }
};

export default {
  validateServiceToken,
  validateUserOrService
};