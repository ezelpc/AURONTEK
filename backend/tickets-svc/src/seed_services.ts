import Servicio from './Models/Servicio';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const servicios = [
    // Infraestructura (2 nuevos + 1 existente)
    {
        nombre: 'Instalación de cableado',
        tipo: 'Requerimiento',
        categoria: 'Redes',
        prioridad: 'Media',
        sla: '4HRS',
        gruposDeAtencion: 'Infraestructura',
        alcance: 'local'
    },
    {
        nombre: 'Configuración de switches',
        tipo: 'Requerimiento',
        categoria: 'Redes',
        prioridad: 'Alta',
        sla: '2HRS',
        gruposDeAtencion: 'Infraestructura',
        alcance: 'local'
    },

    // Mesa de Servicio (4 servicios)
    {
        nombre: 'Desbloqueo de cuenta',
        tipo: 'Requerimiento',
        categoria: 'Accesos',
        prioridad: 'Alta',
        sla: '1HR',
        gruposDeAtencion: 'Mesa de Servicio',
        alcance: 'local'
    },
    {
        nombre: 'Reseteo de contraseña',
        tipo: 'Requerimiento',
        categoria: 'Accesos',
        prioridad: 'Alta',
        sla: '30MIN',
        gruposDeAtencion: 'Mesa de Servicio',
        alcance: 'local'
    },
    {
        nombre: 'Instalación de software',
        tipo: 'Requerimiento',
        categoria: 'Software',
        prioridad: 'Media',
        sla: '4HRS',
        gruposDeAtencion: 'Mesa de Servicio',
        alcance: 'local'
    },
    {
        nombre: 'Configuración de correo',
        tipo: 'Requerimiento',
        categoria: 'Software',
        prioridad: 'Media',
        sla: '2HRS',
        gruposDeAtencion: 'Mesa de Servicio',
        alcance: 'local'
    },

    // Soporte Técnico (3 servicios)
    {
        nombre: 'Reparación de equipo',
        tipo: 'Incidente',
        categoria: 'Hardware',
        prioridad: 'Alta',
        sla: '8HRS',
        gruposDeAtencion: 'Soporte Técnico',
        alcance: 'local'
    },
    {
        nombre: 'Actualización de sistema operativo',
        tipo: 'Requerimiento',
        categoria: 'Software',
        prioridad: 'Media',
        sla: '6HRS',
        gruposDeAtencion: 'Soporte Técnico',
        alcance: 'local'
    },
    {
        nombre: 'Diagnóstico de hardware',
        tipo: 'Incidente',
        categoria: 'Hardware',
        prioridad: 'Alta',
        sla: '4HRS',
        gruposDeAtencion: 'Soporte Técnico',
        alcance: 'local'
    },

    // Seguridad (2 servicios)
    {
        nombre: 'Revisión de accesos',
        tipo: 'Requerimiento',
        categoria: 'Seguridad',
        prioridad: 'Crítica',
        sla: '2HRS',
        gruposDeAtencion: 'Seguridad',
        alcance: 'local'
    },
    {
        nombre: 'Análisis de vulnerabilidades',
        tipo: 'Incidente',
        categoria: 'Seguridad',
        prioridad: 'Crítica',
        sla: '1HR',
        gruposDeAtencion: 'Seguridad',
        alcance: 'local'
    },

    // Desarrollo (2 servicios)
    {
        nombre: 'Solicitud de ambiente de desarrollo',
        tipo: 'Requerimiento',
        categoria: 'Desarrollo',
        prioridad: 'Media',
        sla: '24HRS',
        gruposDeAtencion: 'Desarrollo',
        alcance: 'local'
    },
    {
        nombre: 'Acceso a repositorio',
        tipo: 'Requerimiento',
        categoria: 'Desarrollo',
        prioridad: 'Alta',
        sla: '2HRS',
        gruposDeAtencion: 'Desarrollo',
        alcance: 'local'
    }
];

async function seed() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aurontek';
        await mongoose.connect(mongoUri);
        console.log('✅ Conectado a MongoDB');

        let created = 0;
        let updated = 0;

        for (const servicio of servicios) {
            const existing = await Servicio.findOne({ nombre: servicio.nombre });

            if (existing) {
                await Servicio.findByIdAndUpdate(existing._id, {
                    ...servicio,
                    activo: true,
                    plantilla: []
                });
                updated++;
                console.log(`📝 Actualizado: ${servicio.nombre}`);
            } else {
                await Servicio.create({
                    ...servicio,
                    activo: true,
                    plantilla: []
                });
                created++;
                console.log(`✨ Creado: ${servicio.nombre}`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`✅ Seed completado exitosamente`);
        console.log(`   📊 Servicios creados: ${created}`);
        console.log(`   📝 Servicios actualizados: ${updated}`);
        console.log(`   📦 Total: ${created + updated}`);
        console.log('='.repeat(60));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error en seed:', error);
        process.exit(1);
    }
}

seed();
