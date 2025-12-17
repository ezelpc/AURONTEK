import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Servicio from './Models/Servicio';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const seedCatalogo = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI no está definida en las variables de entorno.');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    console.log('🗑️  Limpiando catálogo existente...');
    await Servicio.deleteMany({});

    // Servicios INTERNOS de Aurontek (alcance INTERNO)
    const serviciosInternos = [
      // === ÁREA: REDES ===
      { nombre: 'Acceso a VPN', tipo: 'Requerimiento', categoria: 'Redes', alcance: 'INTERNO', prioridad: 'Alta', sla: '4 horas', gruposDeAtencion: 'Telecomunicaciones' },
      { nombre: 'Sin señal wifi', tipo: 'Incidente', categoria: 'Redes', alcance: 'INTERNO', prioridad: 'Media', sla: '12 horas', gruposDeAtencion: 'Telecomunicaciones' },
      { nombre: 'Caída de enlace Local', tipo: 'Incidente', categoria: 'Redes', alcance: 'INTERNO', prioridad: 'Alta', sla: '4 horas', gruposDeAtencion: 'Telecomunicaciones' },

      // === ÁREA: COMPUTO PERSONAL ===
      { nombre: 'Computadora Lenta', tipo: 'Incidente', categoria: 'Computo Personal', alcance: 'INTERNO', prioridad: 'Media', sla: '8 horas', gruposDeAtencion: 'Soporte TI' },
      { nombre: 'Solicitud de Equipo Nuevo', tipo: 'Requerimiento', categoria: 'Computo Personal', alcance: 'INTERNO', prioridad: 'Media', sla: '72 horas', gruposDeAtencion: 'Compras TI' },
      { nombre: 'Instalación de Software', tipo: 'Requerimiento', categoria: 'Computo Personal', alcance: 'INTERNO', prioridad: 'Baja', sla: '24 horas', gruposDeAtencion: 'Soporte TI' },

      // === ÁREA: IMPRESIÓN ===
      { nombre: 'Falla de Impresora', tipo: 'Incidente', categoria: 'Impresión', alcance: 'INTERNO', prioridad: 'Media', sla: '8 horas', gruposDeAtencion: 'Soporte TI' },
      { nombre: 'Solicitud de Toner', tipo: 'Requerimiento', categoria: 'Impresión', alcance: 'INTERNO', prioridad: 'Baja', sla: '48 horas', gruposDeAtencion: 'Compras' },

      // === ÁREA: PLATAFORMA AURONTEK ===
      { nombre: 'Error en Facturación (Bug)', tipo: 'Incidente', categoria: 'Plataforma Aurontek', alcance: 'PLATAFORMA', prioridad: 'Alta', sla: '4 horas', gruposDeAtencion: 'Desarrollo' },
      { nombre: 'Caída del Servicio Web', tipo: 'Incidente', categoria: 'Plataforma Aurontek', alcance: 'PLATAFORMA', prioridad: 'Critica', sla: '1 hora', gruposDeAtencion: 'DevOps' },
      { nombre: 'Solicitud de Nueva Funcionalidad', tipo: 'Requerimiento', categoria: 'Plataforma Aurontek', alcance: 'PLATAFORMA', prioridad: 'Baja', sla: '7 días', gruposDeAtencion: 'Producto' },

      // === ÁREA: SOPORTE FUNCIONAL ===
      { nombre: 'Duda sobre Módulo X', tipo: 'Requerimiento', categoria: 'Soporte Funcional', alcance: 'PLATAFORMA', prioridad: 'Media', sla: '12 horas', gruposDeAtencion: 'Soporte' },

      // === ÁREA: SEGURIDAD ===
      { nombre: 'Reporte de Vulnerabilidad', tipo: 'Incidente', categoria: 'Seguridad', alcance: 'PLATAFORMA', prioridad: 'Alta', sla: '2 horas', gruposDeAtencion: 'Seguridad' }
    ];

    console.log('🌱 Insertando servicios INTERNOS...');
    await Servicio.insertMany(serviciosInternos);

    console.log(`✅ Catálogo instalado correctamente con ${serviciosInternos.length} servicios.`);
  } catch (error) {
    console.error('❌ Error al instalar el catálogo:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Conexión a MongoDB cerrada.');
    process.exit(0);
  }
};

seedCatalogo();