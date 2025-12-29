import mongoose from 'mongoose';
import Habilidad from '../Models/Habilidad.model';
import { Empresa } from '../Models/AltaEmpresas.models';

/**
 * Script de migración para agregar campo 'empresa' a grupos de atención existentes
 * 
 * Este script:
 * 1. Busca todos los grupos de atención sin campo empresa
 * 2. Los asigna a AurontekHQ por defecto
 * 3. Muestra un resumen de los cambios
 */

async function migrarGruposDeAtencion() {
    try {
        console.log('🔄 Iniciando migración de Grupos de Atención...\n');

        // 1. Buscar AurontekHQ
        const aurontekHQ = await Empresa.findOne({ rfc: 'AURONTEK001' });

        if (!aurontekHQ) {
            throw new Error('❌ No se encontró AurontekHQ. Asegúrate de que existe en la base de datos.');
        }

        console.log(`✅ AurontekHQ encontrado: ${aurontekHQ.nombre} (${aurontekHQ._id})\n`);

        // 2. Buscar grupos sin campo empresa
        const gruposSinEmpresa = await Habilidad.find({
            $or: [
                { empresa: { $exists: false } },
                { empresa: null }
            ]
        });

        console.log(`📊 Grupos sin empresa encontrados: ${gruposSinEmpresa.length}\n`);

        if (gruposSinEmpresa.length === 0) {
            console.log('✅ No hay grupos que migrar. Todos ya tienen empresa asignada.');
            return;
        }

        // 3. Mostrar grupos a migrar
        console.log('📋 Grupos que serán migrados a AurontekHQ:');
        gruposSinEmpresa.forEach((grupo: any, index: number) => {
            console.log(`   ${index + 1}. ${grupo.nombre}`);
        });
        console.log('');

        // 4. Actualizar grupos
        const resultado = await Habilidad.updateMany(
            {
                $or: [
                    { empresa: { $exists: false } },
                    { empresa: null }
                ]
            },
            {
                $set: {
                    empresa: aurontekHQ._id
                }
            }
        );

        console.log(`✅ Migración completada:`);
        console.log(`   - Grupos actualizados: ${resultado.modifiedCount}`);
        console.log(`   - Todos los grupos ahora pertenecen a: ${aurontekHQ.nombre}\n`);

        // 5. Verificar resultado
        const gruposActualizados = await Habilidad.find({
            empresa: aurontekHQ._id
        });

        console.log(`📊 Verificación final:`);
        console.log(`   - Total de grupos en AurontekHQ: ${gruposActualizados.length}`);
        console.log(`   - Grupos sin empresa: ${await Habilidad.countDocuments({ empresa: null })}\n`);

        console.log('✅ Migración exitosa!\n');
        console.log('💡 Nota: Si necesitas asignar grupos a otras empresas,');
        console.log('   puedes hacerlo manualmente desde el panel de administración.');

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        throw error;
    }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aurontek';

    mongoose.connect(MONGODB_URI)
        .then(async () => {
            console.log('🔌 Conectado a MongoDB\n');
            await migrarGruposDeAtencion();
            await mongoose.disconnect();
            console.log('🔌 Desconectado de MongoDB');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error de conexión:', error);
            process.exit(1);
        });
}

export default migrarGruposDeAtencion;
