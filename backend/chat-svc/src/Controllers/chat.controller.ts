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
        const secret = process.env.JWT_SECRET || 'secret';
        const decoded: any = jwt.verify(token, secret);

        const mensajes = await chatService.obtenerHistorialChat(
            ticketId,
            decoded.id,
            {
                limite: parseInt(limite as string) || 50,
                desde: desde ? new Date(desde as string) : undefined
            },
            authHeader // Pasar el token completo
        );

        res.json(mensajes);
    } catch (error: any) {
        console.error('Error historial:', error);
        res.status(403).json({ error: error.message || 'Error del servidor' });
    }
};

export const saveMessage = async (req: Request, res: Response) => {
    try {
        const { ticketId } = req.params;
        const { contenido, tipo, metadata } = req.body;

        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'Token requerido' });

        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'secret';
        const decoded: any = jwt.verify(token, secret);

        const mensaje = await chatService.guardarMensaje(
            {
                ticketId,
                empresaId: decoded.empresaId || '',
                emisorId: decoded.id,
                contenido,
                tipo: tipo || 'texto',
                metadata
            },
            authHeader // Pasar el token completo
        );

        res.status(201).json(mensaje);
    } catch (error: any) {
        console.error('Error guardando mensaje:', error);
        res.status(403).json({ error: error.message || 'Error guardando mensaje' });
    }
};
