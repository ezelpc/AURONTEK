import jwt from 'jsonwebtoken';
export const auth = async (req, res, next) => {
    const header = req.header('Authorization');
    const token = header ? header.replace('Bearer ', '') : null;
    if (!token) {
        res.status(401).json({ msg: 'Token no proporcionado' });
        return;
    }
    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET not configured');
        }
        const decoded = jwt.verify(token, jwtSecret);
        req.usuario = decoded;
        next();
    }
    catch (error) {
        console.error('JWT error:', error);
        res.status(401).json({ msg: 'Token inválido' });
    }
};
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.usuario || !roles.includes(req.usuario.rol)) {
            res.status(403).json({
                msg: 'No tiene permisos para realizar esta acción'
            });
            return;
        }
        next();
    };
};
