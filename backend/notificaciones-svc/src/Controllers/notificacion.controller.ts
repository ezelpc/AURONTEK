import { Request, Response } from 'express';
import Notificacion from '../Models/Notificacion';
import jwt from 'jsonwebtoken';

const getUserIdFromToken = (req: Request): string | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    try {
        const decoded: any = jwt.decode(token);
        return decoded?.id || decoded?.uid || null;
    } catch (e) {
        return null;
    }
};

export const notificacionController = {
    listar: async (req: Request, res: Response) => {
        try {
            const userId = getUserIdFromToken(req);
            if (!userId) {
                return res.status(401).json({ msg: 'No autorizado' });
            }

            const { leida, limite = 20 } = req.query;
            const filtro: any = { usuarioId: userId };

            if (leida !== undefined) {
                filtro.leida = leida === 'true';
            }

            const notificaciones = await Notificacion.find(filtro)
                .sort({ createdAt: -1 })
                .limit(Number(limite));

            res.json(notificaciones);
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: 'Error al obtener notificaciones' });
        }
    },

    marcarLeida: async (req: Request, res: Response) => {
        try {
            const userId = getUserIdFromToken(req);
            const { id } = req.params;

            const notificacion = await Notificacion.findOneAndUpdate(
                { _id: id, usuarioId: userId },
                { leida: true },
                { new: true }
            );

            if (!notificacion) return res.status(404).json({ msg: 'Notificación no encontrada' });
            res.json(notificacion);
        } catch (error) {
            res.status(500).json({ msg: 'Error al marcar lectura' });
        }
    },

    marcarTodasLeidas: async (req: Request, res: Response) => {
        try {
            const userId = getUserIdFromToken(req);
            await Notificacion.updateMany(
                { usuarioId: userId, leida: false },
                { leida: true }
            );
            res.json({ msg: 'Todas marcadas como leídas' });
        } catch (error) {
            res.status(500).json({ msg: 'Error al marcar todas' });
        }
    },

    eliminar: async (req: Request, res: Response) => {
        try {
            const userId = getUserIdFromToken(req);
            const { id } = req.params;
            await Notificacion.findOneAndDelete({ _id: id, usuarioId: userId });
            res.json({ msg: 'Eliminada' });
        } catch (error) {
            res.status(500).json({ msg: 'Error al eliminar' });
        }
    },

    contarNoLeidas: async (req: Request, res: Response) => {
        try {
            const userId = getUserIdFromToken(req);
            const count = await Notificacion.countDocuments({ usuarioId: userId, leida: false });
            res.json({ count }); // Frontend espera { count: number } o number directo?
            // notificacionesService.js: return response.data.
        } catch (error) {
            res.status(500).json({ msg: 'Error al contar' });
        }
    },

    obtenerPreferencias: async (req: Request, res: Response) => {
        // Mock, no implemented yet
        res.json({});
    },

    actualizarPreferencias: async (req: Request, res: Response) => {
        // Mock
        res.json({});
    }
};
