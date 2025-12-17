import api from '@/api/axios';

export const usuariosService = {
    // Obtener información básica de múltiples usuarios por IDs
    getUsersByIds: async (userIds: string[]): Promise<Record<string, { nombre: string, correo: string }>> => {
        try {
            // Filter out null/undefined IDs
            const validIds = userIds.filter(id => id);
            if (validIds.length === 0) return {};

            // Call usuarios service to get user info
            const promises = validIds.map(id =>
                api.get(`/usuarios/${id}`).catch(() => null)
            );

            const responses = await Promise.all(promises);

            // Build a map of userId -> user info
            const userMap: Record<string, { nombre: string, correo: string }> = {};
            responses.forEach((response, index) => {
                if (response?.data) {
                    const userId = validIds[index];
                    userMap[userId] = {
                        nombre: response.data.nombre || 'N/A',
                        correo: response.data.correo || ''
                    };
                }
            });

            return userMap;
        } catch (error) {
            console.error('Error fetching users:', error);
            return {};
        }
    },

    // Enriquecer tickets con información de usuarios
    enrichTicketsWithUsers: async (tickets: any[]): Promise<any[]> => {
        // Collect all unique user IDs from tickets
        const userIds = new Set<string>();
        tickets.forEach(ticket => {
            if (ticket.usuarioCreador) {
                const id = typeof ticket.usuarioCreador === 'string'
                    ? ticket.usuarioCreador
                    : ticket.usuarioCreador._id;
                if (id) userIds.add(id);
            }
            if (ticket.agenteAsignado) {
                const id = typeof ticket.agenteAsignado === 'string'
                    ? ticket.agenteAsignado
                    : ticket.agenteAsignado._id;
                if (id) userIds.add(id);
            }
        });

        // Fetch user info
        const userMap = await usuariosService.getUsersByIds(Array.from(userIds));

        // Enrich tickets with user names
        return tickets.map(ticket => ({
            ...ticket,
            usuarioCreador: typeof ticket.usuarioCreador === 'string'
                ? userMap[ticket.usuarioCreador] || { nombre: ticket.usuarioCreador.slice(-6), correo: '' }
                : ticket.usuarioCreador,
            agenteAsignado: typeof ticket.agenteAsignado === 'string'
                ? userMap[ticket.agenteAsignado] || { nombre: ticket.agenteAsignado.slice(-6), correo: '' }
                : ticket.agenteAsignado
        }));
    }
};
