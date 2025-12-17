import { Request, Response } from 'express';
import dashboardService from '../Services/dashboard.service';

const dashboardController = {
    async getStats(req: Request, res: Response) {
        try {
            const stats = await dashboardService.getGlobalStats();
            res.json(stats);
        } catch (error: any) {
            res.status(500).json({ msg: 'Error al obtener estadísticas', error: error.message });
        }
    }
};

export default dashboardController;
