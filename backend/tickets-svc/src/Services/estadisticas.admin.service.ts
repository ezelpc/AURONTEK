import Ticket from '../Models/Ticket.model';

class EstadisticasAdminService {

    /**
     * Obtiene métricas globales para el Dashboard de Admin General
     * No filtra por empresaId, ve la totalidad del sistema.
     */
    async getGlobalStats() {
        try {
            console.log("Calculando estadísticas globales...");

            const [
                totalTickets,
                ticketsPendientes,
                ticketsCriticos,
                ticketsResueltosMes,
                conteoPorEstado,
                conteoPorPrioridad
            ] = await Promise.all([
                // 1. Total histórico
                Ticket.countDocuments({}),

                // 2. Pendientes (Abiertos + En Proceso)
                Ticket.countDocuments({ estado: { $in: ['abierto', 'en_proceso'] } }),

                // 3. Críticos (Prioridad Alta/Crítica + Estado no resuelto)
                Ticket.countDocuments({
                    prioridad: { $in: ['alta', 'critica'] },
                    estado: { $nin: ['resuelto', 'cerrado'] }
                }),

                // 4. Resueltos este mes
                Ticket.countDocuments({
                    estado: { $in: ['resuelto', 'cerrado'] },
                    updatedAt: {
                        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                    }
                }),

                // 5. Agrupación por Estado (Para Gráfica de Barras)
                Ticket.aggregate([
                    { $group: { _id: "$estado", count: { $sum: 1 } } }
                ]),

                // 6. Agrupación por Prioridad (Para Gráfica de Pastel)
                // Solo de tickets NO resueltos para ver la "carga activa"
                Ticket.aggregate([
                    { $match: { estado: { $nin: ['resuelto', 'cerrado'] } } },
                    { $group: { _id: "$prioridad", count: { $sum: 1 } } }
                ])
            ]);

            return {
                kpis: {
                    total: totalTickets,
                    pendientes: ticketsPendientes,
                    criticos: ticketsCriticos,
                    resueltosMes: ticketsResueltosMes
                },
                graficas: {
                    estados: conteoPorEstado.map(e => ({ name: e._id, value: e.count })),
                    prioridad: conteoPorPrioridad.map(p => ({ name: p._id, value: p.count }))
                }
            };

        } catch (error) {
            console.error("Error en getGlobalStats:", error);
            throw error;
        }
    }
}

export default new EstadisticasAdminService();
