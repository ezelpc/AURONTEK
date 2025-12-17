// Controllers/estadisticas.controller.ts
import { Request, Response } from 'express';
import estadisticasService from '../Services/estadisticas.service';
import estadisticasAdminService from '../Services/estadisticas.admin.service';

const estadisticasController = {
    /**
     * GET /tickets/estadisticas/resolvers
     * Obtener estadísticas de performance de resolvers
     */
    async obtenerEstadisticasResolvers(req: Request, res: Response): Promise<void> {
        try {
            const empresaId = req.usuario?.empresaId;

            if (!empresaId) {
                res.status(400).json({ msg: 'ID de empresa no encontrado' });
                return;
            }

            const stats = await estadisticasService.obtenerEstadisticasResolvers(empresaId);
            res.json(stats);
        } catch (error: any) {
            console.error('Error obteniendo estadísticas de resolvers:', error);
            res.status(500).json({ msg: 'Error al obtener estadísticas', error: error.message });
        }
    },

    /**
     * GET /tickets/estadisticas/quemados
     * Obtener tickets que excedieron su SLA
     */
    async obtenerTicketsQuemados(req: Request, res: Response): Promise<void> {
        try {
            const empresaId = req.usuario?.empresaId;

            if (!empresaId) {
                res.status(400).json({ msg: 'ID de empresa no encontrado' });
                return;
            }

            const stats = await estadisticasService.obtenerTicketsQuemados(empresaId);
            res.json(stats);
        } catch (error: any) {
            console.error('Error obteniendo tickets quemados:', error);
            res.status(500).json({ msg: 'Error al obtener tickets quemados', error: error.message });
        }
    },

    /**
     * GET /tickets/estadisticas/calificaciones
     * Obtener calificaciones promedio por resolver
     */
    async obtenerCalificaciones(req: Request, res: Response): Promise<void> {
        try {
            const empresaId = req.usuario?.empresaId;

            if (!empresaId) {
                res.status(400).json({ msg: 'ID de empresa no encontrado' });
                return;
            }

            const ratings = await estadisticasService.obtenerCalificacionesResolvers(empresaId);
            res.json(ratings);
        } catch (error: any) {
            console.error('Error obteniendo calificaciones:', error);
            res.status(500).json({ msg: 'Error al obtener calificaciones', error: error.message });
        }
    },

    /**
     * GET /tickets/estadisticas
     * Obtener estadísticas generales (compatibilidad con endpoint existente)
     */
    async obtenerEstadisticasGenerales(req: Request, res: Response): Promise<void> {
        try {
            const empresaId = req.usuario?.empresaId;

            if (!empresaId) {
                res.status(400).json({ msg: 'ID de empresa no encontrado' });
                return;
            }

            const stats = await estadisticasService.obtenerEstadisticasGenerales(empresaId);
            res.json(stats);
        } catch (error: any) {
            console.error('Error obteniendo estadísticas generales:', error);
            res.status(500).json({ msg: 'Error al obtener estadísticas', error: error.message });
        }
    },
    async obtenerEstadisticasGlobales(req: Request, res: Response): Promise<void> {
        try {
            const stats = await estadisticasAdminService.getGlobalStats();
            res.json(stats);
        } catch (error: any) {
            console.error('Error obteniendo estadísticas globales:', error);
            res.status(500).json({ msg: 'Error al obtener estadísticas globales', error: error.message });
        }
    }
};

export default estadisticasController;
