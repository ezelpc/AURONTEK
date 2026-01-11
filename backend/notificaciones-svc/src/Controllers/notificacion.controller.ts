import { Request, Response } from 'express';
import Notificacion from '../Models/Notificacion';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../Services/email.service';

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

// Helper para verificar token de servicio
const verificarTokenServicio = (token: string): boolean => {
    const tokenSecreto = process.env.SERVICE_TOKEN || 'desarrollo';
    return token === tokenSecreto;
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
    },

    // Endpoint para enviar emails del sistema (usado por otros servicios como usuarios-svc, tickets-svc)
    enviarEmailSistema: async (req: Request, res: Response) => {
        try {
            // Verificar autorización por token de servicio
            const authHeader = req.headers.authorization;
            const token = authHeader?.split(' ')[1] || req.body?.serviceToken;
            
            // En desarrollo, permitir sin token
            if (process.env.NODE_ENV === 'production' && !verificarTokenServicio(token || '')) {
                return res.status(401).json({ msg: 'Token de servicio inválido' });
            }

            const { to, subject, text, html } = req.body;

            // Validar campos requeridos
            if (!to || !subject) {
                return res.status(400).json({ msg: 'Los campos "to" y "subject" son requeridos' });
            }

            // Enviar email
            await sendEmail({
                to,
                subject,
                text: text || undefined,
                html: html || undefined
            });

            res.json({ 
                msg: 'Email enviado exitosamente',
                to,
                subject
            });
        } catch (error) {
            console.error('❌ Error enviando email del sistema:', error);
            res.status(500).json({ 
                msg: 'Error al enviar email',
                error: (error as any)?.message
            });
        }
    },

    // Eliminar todas las notificaciones del usuario
    eliminarTodas: async (req: Request, res: Response) => {
        try {
            const userId = getUserIdFromToken(req);
            if (!userId) {
                return res.status(401).json({ msg: 'No autorizado' });
            }

            const resultado = await Notificacion.deleteMany({ usuarioId: userId });
            res.json({ 
                msg: 'Todas las notificaciones eliminadas',
                eliminadas: resultado.deletedCount
            });
        } catch (error) {
            res.status(500).json({ msg: 'Error al eliminar notificaciones' });
        }
    },

    // Crear notificación desde otro servicio (usando SERVICE_TOKEN)
    crearNotificacion: async (req: Request, res: Response) => {
        try {
            // Verificar autorización
            const authHeader = req.headers.authorization;
            const token = authHeader?.split(' ')[1];
            const tokenSecreto = process.env.SERVICE_TOKEN || 'desarrollo';
            
            // En producción, verificar token; en desarrollo, permitir sin token
            if (process.env.NODE_ENV === 'production' && (!token || token !== tokenSecreto)) {
                return res.status(401).json({ msg: 'No autorizado - TOKEN inválido' });
            }

            const { usuarioId, titulo, mensaje, tipo = 'info', metadata, link } = req.body;

            // Validar campos requeridos
            if (!usuarioId || !titulo || !mensaje) {
                return res.status(400).json({ 
                    msg: 'Los campos usuarioId, titulo y mensaje son requeridos',
                    recibido: { usuarioId, titulo, mensaje }
                });
            }

            // Validar tipo
            const tiposValidos = ['info', 'warning', 'success', 'error'];
            if (tipo && !tiposValidos.includes(tipo)) {
                return res.status(400).json({ 
                    msg: `Tipo inválido. Debe ser uno de: ${tiposValidos.join(', ')}`
                });
            }

            // Crear notificación
            const notificacion = new Notificacion({
                usuarioId,
                titulo,
                mensaje,
                tipo,
                leida: false,
                metadata: metadata || {},
                link: link || undefined
            });

            await notificacion.save();

            console.log('✅ Notificación creada desde servicio:', {
                usuarioId,
                titulo,
                tipo,
                timestamp: new Date().toISOString()
            });

            res.status(201).json({
                msg: 'Notificación creada exitosamente',
                notificacion
            });
        } catch (error: any) {
            console.error('❌ Error creando notificación:', error);
            res.status(500).json({ 
                msg: 'Error al crear notificación',
                error: error.message
            });
        }
    }
};
