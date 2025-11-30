// Middleware/service.middleware.js

/**
 * Middleware para validar tokens de comunicación entre servicios
 * Permite que los microservicios se comuniquen de forma segura sin JWT de usuario
 */
export const validateServiceToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const serviceName = req.headers['x-service-name'];
  const serviceToken = process.env.SERVICE_TOKEN;

  // Extraer token del header
  const token = authHeader ? authHeader.replace('Bearer ', '') : null;

  // Validar que el token coincida con el SERVICE_TOKEN
  if (token === serviceToken && serviceName) {
    // Marcar como llamada de servicio
    req.isServiceCall = true;
    req.serviceName = serviceName;
    
    console.log(`✅ Llamada de servicio autorizada: ${serviceName}`);
    return next();
  }

  // Si no es válido, denegar acceso
  return res.status(403).json({ 
    msg: 'Acceso denegado: Token de servicio inválido o ausente' 
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
    const jwt = require('jsonwebtoken');
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