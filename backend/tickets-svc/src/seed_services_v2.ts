import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Service from './Models/Servicio.ts'; // Adjust path if needed (Servicio.ts is in Models)

dotenv.config();

const servicesData = [
    {
        nombre: 'Mapeo de carpetas compartidas',
        tipo: 'Requerimiento',
        categoria: 'Almacenamiento',
        dependencias: 'Server File',
        cicloDeVida: 'Activos',
        impacto: '3',
        urgencia: '1',
        prioridad: 'Alta',
        sla: '4 horas',
        gruposDeAtencion: 'Mesa de Servicio'
    },
    {
        nombre: 'Cambios de usuario en carpeta compartida',
        tipo: 'Requerimiento',
        categoria: 'Almacenamiento',
        dependencias: 'Server File',
        cicloDeVida: 'Activos',
        impacto: '3',
        urgencia: '1',
        prioridad: 'Media', // Image says Media, calculated 8 hours
        sla: '8 horas',
        gruposDeAtencion: 'Servidores/Respaldos/Storage'
    },
    {
        nombre: 'La carpeta no esta disponible',
        tipo: 'Incidente',
        categoria: 'Almacenamiento',
        dependencias: 'Server File',
        cicloDeVida: 'Activos',
        impacto: '3',
        urgencia: '3',
        prioridad: 'Baja',
        sla: '20 horas',
        gruposDeAtencion: 'Servidores/Respaldos/Storage'
    },
    {
        nombre: 'Alta de usuario a carpeta compartida',
        tipo: 'Requerimiento',
        categoria: 'Almacenamiento',
        dependencias: 'Directorio Activo',
        cicloDeVida: 'Activos',
        impacto: '2',
        urgencia: '1',
        prioridad: 'Alta',
        sla: '8 horas',
        gruposDeAtencion: 'Servidores/Respaldos/Storage'
    },
    {
        nombre: 'Baja de usuario en carpeta compartida',
        tipo: 'Requerimiento',
        categoria: 'Almacenamiento',
        dependencias: 'Server File',
        cicloDeVida: 'Activos',
        impacto: '3',
        urgencia: '1',
        prioridad: 'Alta',
        sla: '8 horas',
        gruposDeAtencion: 'Servidores/Respaldos/Storage'
    },
    {
        nombre: 'Permisos de acceso a servidor',
        tipo: 'Requerimiento',
        categoria: 'Almacenamiento',
        dependencias: 'Directorio Activo',
        cicloDeVida: 'Activos',
        impacto: '2',
        urgencia: '3',
        prioridad: 'Media',
        sla: '12 horas',
        gruposDeAtencion: 'Servidores/Respaldos/Storage'
    },
    {
        nombre: 'Requerimientos varios (aplicaciones)',
        tipo: 'Requerimiento',
        categoria: 'Aplicaciones Internas',
        dependencias: 'La solicitud del requerimiento debe', // Cut off in image?
        cicloDeVida: 'Activos',
        impacto: '3',
        urgencia: '2',
        prioridad: 'Media',
        sla: '24 horas',
        gruposDeAtencion: 'Desarrollo Y BD'
    },
    {
        nombre: 'Robo de equipo cómputo',
        tipo: 'Incidente',
        categoria: 'Computo Personal',
        dependencias: 'Acta de Robo',
        cicloDeVida: 'Activos',
        impacto: '2',
        urgencia: '2',
        prioridad: 'Media',
        sla: '32 horas',
        gruposDeAtencion: 'Mesa de Servicio'
    },
    {
        nombre: 'Hojas de liberación',
        tipo: 'Requerimiento',
        categoria: 'Computo Personal',
        dependencias: 'CMDB',
        cicloDeVida: 'Activos',
        impacto: '2',
        urgencia: '2',
        prioridad: 'Media',
        sla: '8 horas',
        gruposDeAtencion: 'Mesa de Servicio'
    },
    {
        nombre: 'Prestamo de equipo/cargador',
        tipo: 'Requerimiento',
        categoria: 'Computo Personal',
        dependencias: 'NA',
        cicloDeVida: 'Activos',
        impacto: '2',
        urgencia: '2',
        prioridad: 'Media',
        sla: '8 horas',
        gruposDeAtencion: 'Mesa de Servicio'
    },
    {
        nombre: 'Solicitud de proyector y Poly',
        tipo: 'Requerimiento',
        categoria: 'Computo Personal',
        dependencias: 'NA',
        cicloDeVida: 'Activos',
        impacto: '2',
        urgencia: '2',
        prioridad: 'Media',
        sla: '8 horas',
        gruposDeAtencion: 'Soporte TI'
    },
    {
        nombre: 'Solicitud de Reporte',
        tipo: 'Requerimiento',
        categoria: 'Computo Personal',
        dependencias: 'NA',
        cicloDeVida: 'Activos',
        impacto: '2',
        urgencia: '2',
        prioridad: 'Media',
        sla: '20 horas',
        gruposDeAtencion: 'Mesa de Servicio'
    },
    {
        nombre: 'Autorización, adquisición y asignación periféricos',
        tipo: 'Requerimiento',
        categoria: 'Computo Personal',
        dependencias: 'Vo. Bo. Lider de área, ordenes de',
        cicloDeVida: 'Activos',
        impacto: '3',
        urgencia: '2',
        prioridad: 'Baja',
        sla: '180 horas',
        gruposDeAtencion: 'Soporte TI'
    },
    {
        nombre: 'Instalación de periféricos',
        tipo: 'Requerimiento',
        categoria: 'Computo Personal',
        dependencias: 'NA',
        cicloDeVida: 'Activos',
        impacto: '3',
        urgencia: '1',
        prioridad: 'Media',
        sla: '12 horas',
        gruposDeAtencion: 'Mesa de Servicio'
    }
];

const seedServices = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/aurontek_tickets';
        // Fix: Connect without deprecated options
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Clear existing services? Maybe optional. distinct to avoid duplicates
        // For now, let's just insert if not exists
        for (const serviceData of servicesData) {
            const exists = await (Service as any).findOne({ nombre: serviceData.nombre });
            if (!exists) {
                await (Service as any).create(serviceData);
                console.log(`Created service: ${serviceData.nombre}`);
            } else {
                // Update
                await (Service as any).updateOne({ _id: exists._id }, serviceData);
                console.log(`Updated service: ${serviceData.nombre}`);
            }
        }

        console.log('Seeding completed');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding services:', error);
        process.exit(1);
    }
};

seedServices();
