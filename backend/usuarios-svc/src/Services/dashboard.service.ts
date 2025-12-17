import { Empresa } from '../Models/AltaEmpresas.models';
import Usuario from '../Models/AltaUsuario.models';

class DashboardService {
    async getGlobalStats() {
        try {
            const [
                totalEmpresas,
                empresasActivas,
                totalUsuarios,
                usuariosActivos
            ] = await Promise.all([
                Empresa.countDocuments(),
                Empresa.countDocuments({ activo: true }),
                Usuario.countDocuments(),
                Usuario.countDocuments({ activo: true }) // Assuming field is 'activo'
            ]);

            console.log('Stats calculated:', { totalEmpresas, empresasActivas, totalUsuarios, usuariosActivos });

            return {
                empresas: {
                    total: totalEmpresas,
                    activas: empresasActivas,
                    inactivas: totalEmpresas - empresasActivas
                },
                usuarios: {
                    total: totalUsuarios,
                    activos: usuariosActivos,
                    inactivos: totalUsuarios - usuariosActivos
                }
            };
        } catch (error) {
            console.error('Error calculando estadísticas en Usuarios-SVC:', error);
            throw error;
        }
    }
}

export default new DashboardService();
