// Middleware/auth.middleware.js
import jwt from 'jsonwebtoken';

export const auth = async (req, res, next) => {
  const header = req.header('Authorization');
  const token = header ? header.replace('Bearer ', '') : null;

  if (!token) {
    return res.status(401).json({ msg: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    console.error('JWT error:', error);
    res.status(401).json({ msg: 'Token inválido' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return res.status(403).json({
        msg: 'No tiene permisos para realizar esta acción'
      });
    }
    next();
  };
};
