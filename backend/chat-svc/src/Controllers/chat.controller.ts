import { Request, Response } from 'express';
import chatService from '../Services/chat.service';
import jwt from 'jsonwebtoken';

export const getChatHistory = async (req: Request, res: Response) => {
    try {
        const { ticketId } = req.params;
        const { limite, desde } = req.query;

        // Note: Auth might be handled by middleware in Routes, but for now reproducing logic
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'Token requerido' });

        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

        const mensajes = await chatService.obtenerHistorialChat(ticketId, decoded.id, {
            limite: parseInt(limite as string) || 50,
            desde: desde ? new Date(desde as string) : undefined
        });

        res.json(mensajes);
    } catch (error: any) {
        console.error('Error historial:', error);
        res.status(403).json({ error: error.message || 'Error del servidor' });
    }
};
