import mongoose from 'mongoose';
import dotenv from 'dotenv';

// @ts-ignore
import bcrypt from 'bcryptjs';

// Cargar variables de entorno
dotenv.config();

// Se define UsuarioSchema primero porque AdminSchema depende de él.
const UsuarioSchema = new mongoose.Schema({
  nombre: String,
  correo: { type: String, unique: true },
  contraseña: String,
  empresa: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa' },
  rol: String,
  puesto: String,
  habilidades: [String],
  gruposDeAtencion: [String], // Grupos técnicos de atención
  permissions: [String], // RBAC User-Centric
  estado_actividad: { type: String, enum: ['available', 'busy', 'offline'], default: 'offline' },
  activo: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const AdminSchema = new mongoose.Schema({
  ...UsuarioSchema.obj,
  estado_actividad: { type: String, enum: ['available', 'busy', 'offline'], default: 'offline' }
});

// Definición de esquemas simplificados para el seed
// En un entorno real, importaríamos los modelos desde sus archivos
const EmpresaSchema = new mongoose.Schema({
  nombre: String,
  rfc: String,
  correo: String,
  codigo_acceso: String,
  direccion: String,
  telefono: String,
  tipo: { type: String, enum: ['sistema', 'cliente'], default: 'cliente' },
  licencia: [{
    fecha_inicio: Date,
    plan: String,
    estado: Boolean
  }],
  contratantes: [{
    nombre: String,
    correo: String,
    telefono: String,
    puesto: String
  }],
  activo: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const RoleSchema = new mongoose.Schema({
  nombre: String,
  slug: String,
  descripcion: String,
  empresa: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa' },
  permisos: [String],
  nivel: Number
});

const ServicioSchema = new mongoose.Schema({
  nombre: String,
  alcance: { type: String, enum: ['global', 'local'], required: true },
  empresa: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa' }, // ID de la empresa dueña del servicio
  descripcion: String,
  area: String,
  tipo: String,
  prioridad: String,
  sla: String,
  gruposDeAtencion: String,
  precio: Number,
  activo: { type: Boolean, default: true }
});

const HabilidadSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  descripcion: { type: String }
});

const Empresa = mongoose.model('Empresa', EmpresaSchema);
const Role = mongoose.model('Role', RoleSchema);
const Admin = mongoose.model('Admin', AdminSchema);
const Usuario = mongoose.model('Usuario', UsuarioSchema);
const Servicio = mongoose.model('Servicio', ServicioSchema);
const Habilidad = mongoose.model('Habilidad', HabilidadSchema);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aurontek';

async function seed() {
  console.log('🌱 Iniciando proceso de seeding extendido...');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Limpiar base de datos
    console.log('🧹 Limpiando colecciones...');
    // Drop collections to ensure indexes are cleared
    try { await mongoose.connection.db!.dropCollection('empresas'); } catch (e) { }
    try { await mongoose.connection.db!.dropCollection('roles'); } catch (e) { }
    try { await mongoose.connection.db!.dropCollection('admins'); } catch (e) { }
    try { await mongoose.connection.db!.dropCollection('usuarios'); } catch (e) { }
    try { await mongoose.connection.db!.dropCollection('servicios'); } catch (e) { }
    try { await mongoose.connection.db!.dropCollection('habilidads'); } catch (e) { } // Mongoose pluralizes

    // Also use deleteMany just in case
    await Empresa.deleteMany({});
    await Role.deleteMany({});
    await Admin.deleteMany({});
    await Usuario.deleteMany({});
    await Servicio.deleteMany({});
    await Habilidad.deleteMany({});

    // 1. Crear Empresas
    console.log('🏢 Creando empresas...');
    const aurontekHQ = await Empresa.create({
      nombre: 'Aurontek HQ',
      rfc: 'AURONTEK001',
      correo: 'admin@aurontek.com',
      codigo_acceso: 'Aurontek2025', // Requerido para empleados de Aurontek HQ
      direccion: 'HQ Principal',
      telefono: '000-000-0000',
      tipo: 'sistema',
      licencia: [{ fecha_inicio: new Date(), plan: 'Anual', estado: true }],
      contratantes: [{ nombre: 'Admin System Contact', correo: 'admin@aurontek.com', telefono: '000-000-0000', puesto: 'System Owner' }]
    });

    const testSA = await Empresa.create({
      nombre: 'Test S.A.',
      rfc: 'TST123456789',
      correo: 'contacto@testsa.com',
      codigo_acceso: 'TestSA2025',
      direccion: 'Calle Falsa 123',
      telefono: '555-555-5555',
      tipo: 'cliente',
      licencia: [{ fecha_inicio: new Date(), plan: 'Anual', estado: true }],
      contratantes: [{ nombre: 'Contacto Empresa Test', correo: 'admin@testsa.com', telefono: '555-555-5555', puesto: 'Gerente TI' }]
    });

    const innovatech = await Empresa.create({
      nombre: 'Innovatech Solutions',
      rfc: 'INN909090SOL',
      correo: 'contacto@innovatech.com',
      codigo_acceso: 'Inno2025',
      direccion: 'Av. Tecnologico 45',
      telefono: '555-123-4567',
      tipo: 'cliente',
      licencia: [{ fecha_inicio: new Date(), plan: 'Enterprise', estado: true }],
      contratantes: [{ nombre: 'Sarah Connor', correo: 'sarah@innovatech.com', telefono: '555-000-9999', puesto: 'CTO' }]
    });

    const globalLogistics = await Empresa.create({
      nombre: 'Global Logistics',
      rfc: 'GLO888888LOG',
      correo: 'info@global-logistics.com',
      codigo_acceso: 'Global2025',
      direccion: 'Puerto Interior 7',
      telefono: '555-987-6543',
      tipo: 'cliente',
      licencia: [{ fecha_inicio: new Date(), plan: 'Pyme', estado: true }],
      contratantes: [{ nombre: 'John Wick', correo: 'john@global.com', telefono: '555-111-2222', puesto: 'Ops Manager' }]
    });

    const ecoEnergy = await Empresa.create({
      nombre: 'EcoEnergy Corp',
      rfc: 'ECO777777NRG',
      correo: 'contact@ecoenergy.com',
      codigo_acceso: 'Eco2025',
      direccion: 'Parque Eolico 1',
      telefono: '555-333-4444',
      tipo: 'cliente',
      licencia: [{ fecha_inicio: new Date(), plan: 'Enterprise', estado: true }],
      contratantes: [{ nombre: 'Lisa Simpson', correo: 'lisa@eco.com', telefono: '555-444-5555', puesto: 'Sustainability Director' }]
    });

    // 2. Crear Roles Base (Compatibilidad)
    console.log('🛡️ Creando Roles Base...');
    const baseRolesData = [
      // --- SYSTEM ROLES ---
      {
        nombre: 'Admin General',
        slug: 'admin-general',
        descripcion: 'Super Admin del Sistema',
        empresa: aurontekHQ._id,
        permisos: ['*'],
        nivel: 100
      },
      {
        nombre: 'Soporte Plataforma',
        slug: 'soporte-plataforma',
        descripcion: 'Soporte N2',
        empresa: aurontekHQ._id,
        permisos: ['tickets.view_all_global', 'tickets.change_status', 'users.view_global', 'companies.view_all'],
        nivel: 50
      },
      // --- CLIENT ROLES (Generic permissions, specific to each company) ---
    ];
    await Role.insertMany(baseRolesData);

    // Create Company specific roles
    const companyRoles = [
      { emp: testSA, name: 'Admin Interno', slug: 'admin-interno', perms: ['companies.view_all', 'users.create', 'users.update', 'users.delete', 'users.view', 'users.suspend', 'users.recover_password_local', 'tickets.create', 'tickets.view_all', 'tickets.assign', 'servicios.manage_local', 'servicios.import'] },
      { emp: testSA, name: 'Usuario Final', slug: 'cliente-final', perms: ['tickets.create', 'tickets.view_created'] },

      { emp: innovatech, name: 'Admin Interno', slug: 'admin-interno', perms: ['companies.view_all', 'users.create', 'users.update', 'users.delete', 'users.view', 'users.suspend', 'users.recover_password_local', 'tickets.create', 'tickets.view_all', 'tickets.assign', 'servicios.manage_local', 'servicios.import'] },
      { emp: innovatech, name: 'Desarrollador', slug: 'dev', perms: ['tickets.create', 'tickets.view_created', 'tickets.view_all'] }, // devs might see all tickets

      { emp: globalLogistics, name: 'Admin Interno', slug: 'admin-interno', perms: ['companies.view_all', 'users.create', 'users.update', 'users.delete', 'users.view', 'users.suspend', 'users.recover_password_local', 'tickets.create', 'tickets.view_all', 'tickets.assign'] },
      { emp: globalLogistics, name: 'Operador', slug: 'operador', perms: ['tickets.create', 'tickets.view_created'] },

      { emp: ecoEnergy, name: 'Admin Interno', slug: 'admin-interno', perms: ['companies.view_all', 'users.create', 'users.update', 'users.delete', 'users.view', 'users.suspend', 'users.recover_password_local', 'tickets.create', 'tickets.view_all', 'tickets.assign'] },
      { emp: ecoEnergy, name: 'Analista', slug: 'analista', perms: ['tickets.create', 'tickets.view_created'] },
    ];

    for (const r of companyRoles) {
      await Role.create({
        nombre: r.name,
        slug: r.slug,
        descripcion: `Rol ${r.name} para ${r.emp.nombre}`,
        empresa: r.emp._id,
        permisos: r.perms,
        nivel: r.slug === 'admin-interno' ? 50 : 10
      });
    }


    // 3. Crear Servicios
    console.log('🛠️ Creando servicios...');

    // Servicios INTERNOS de Aurontek (para tickets internos del sistema)
    const serviciosInternos = [
      // === ÁREA: REDES ===
      {
        nombre: 'Acceso a VPN',
        alcance: 'global', // Usar 'global' en lugar de 'INTERNO' para compatibilidad
        empresa: aurontekHQ._id,
        tipo: 'Requerimiento',
        area: 'Redes',
        prioridad: 'Alta',
        descripcion: 'Solicitud de acceso VPN para trabajo remoto',
        sla: '4 horas',
        gruposDeAtencion: 'Telecomunicaciones',
        precio: 0,
        activo: true
      },
      {
        nombre: 'Sin señal wifi',
        alcance: 'global',
        empresa: aurontekHQ._id,
        tipo: 'Incidente',
        area: 'Redes',
        prioridad: 'Media',
        descripcion: 'Problemas de conectividad WiFi',
        sla: '12 horas',
        gruposDeAtencion: 'Telecomunicaciones',
        precio: 0,
        activo: true
      },
      {
        nombre: 'Caída de enlace Local',
        alcance: 'global',
        empresa: aurontekHQ._id,
        tipo: 'Incidente',
        area: 'Redes',
        prioridad: 'Alta',
        descripcion: 'Enlace de internet local caído',
        sla: '4 horas',
        gruposDeAtencion: 'Telecomunicaciones',
        precio: 0,
        activo: true
      },

      // === ÁREA: COMPUTO PERSONAL ===
      {
        nombre: 'Computadora Lenta',
        alcance: 'global',
        empresa: aurontekHQ._id,
        tipo: 'Incidente',
        area: 'Computo Personal',
        prioridad: 'Media',
        descripcion: 'Equipo de cómputo con bajo rendimiento',
        sla: '8 horas',
        gruposDeAtencion: 'Soporte TI',
        precio: 0,
        activo: true
      },
      {
        nombre: 'Solicitud de Equipo Nuevo',
        alcance: 'global',
        empresa: aurontekHQ._id,
        tipo: 'Requerimiento',
        area: 'Computo Personal',
        prioridad: 'Media',
        descripcion: 'Solicitud de nuevo equipo de cómputo',
        sla: '72 horas',
        gruposDeAtencion: 'Compras TI',
        precio: 0,
        activo: true
      },
      {
        nombre: 'Instalación de Software',
        alcance: 'global',
        empresa: aurontekHQ._id,
        tipo: 'Requerimiento',
        area: 'Computo Personal',
        prioridad: 'Baja',
        descripcion: 'Instalación de software en equipo de trabajo',
        sla: '24 horas',
        gruposDeAtencion: 'Soporte TI',
        precio: 0,
        activo: true
      },

      // === ÁREA: IMPRESIÓN ===
      {
        nombre: 'Falla de Impresora',
        alcance: 'global',
        empresa: aurontekHQ._id,
        tipo: 'Incidente',
        area: 'Impresión',
        prioridad: 'Media',
        descripcion: 'Impresora no funciona correctamente',
        sla: '8 horas',
        gruposDeAtencion: 'Soporte TI',
        precio: 0,
        activo: true
      },
      {
        nombre: 'Solicitud de Toner',
        alcance: 'global',
        empresa: aurontekHQ._id,
        tipo: 'Requerimiento',
        area: 'Impresión',
        prioridad: 'Baja',
        descripcion: 'Solicitud de toner para impresora',
        sla: '48 horas',
        gruposDeAtencion: 'Compras',
        precio: 0,
        activo: true
      },

      // === ÁREA: PLATAFORMA AURONTEK ===
      {
        nombre: 'Error en Facturación (Bug)',
        alcance: 'global',
        empresa: aurontekHQ._id,
        tipo: 'Incidente',
        area: 'Plataforma Aurontek',
        prioridad: 'Alta',
        descripcion: 'Bug en el módulo de facturación',
        sla: '4 horas',
        gruposDeAtencion: 'Desarrollo',
        precio: 0,
        activo: true
      },
      {
        nombre: 'Caída del Servicio Web',
        alcance: 'global',
        empresa: aurontekHQ._id,
        tipo: 'Incidente',
        area: 'Plataforma Aurontek',
        prioridad: 'Critica',
        descripcion: 'Servicio web no disponible',
        sla: '1 hora',
        gruposDeAtencion: 'DevOps',
        precio: 0,
        activo: true
      },
      {
        nombre: 'Solicitud de Nueva Funcionalidad',
        alcance: 'global',
        empresa: aurontekHQ._id,
        tipo: 'Requerimiento',
        area: 'Plataforma Aurontek',
        prioridad: 'Baja',
        descripcion: 'Solicitud de nueva característica en la plataforma',
        sla: '7 días',
        gruposDeAtencion: 'Producto',
        precio: 0,
        activo: true
      },

      // === ÁREA: SOPORTE FUNCIONAL ===
      {
        nombre: 'Duda sobre Módulo X',
        alcance: 'global',
        empresa: aurontekHQ._id,
        tipo: 'Requerimiento',
        area: 'Soporte Funcional',
        prioridad: 'Media',
        descripcion: 'Consulta sobre funcionalidad de módulo',
        sla: '12 horas',
        gruposDeAtencion: 'Soporte',
        precio: 0,
        activo: true
      },

      // === ÁREA: SEGURIDAD ===
      {
        nombre: 'Reporte de Vulnerabilidad',
        alcance: 'global',
        empresa: aurontekHQ._id,
        tipo: 'Incidente',
        area: 'Seguridad',
        prioridad: 'Alta',
        descripcion: 'Reporte de vulnerabilidad de seguridad',
        sla: '2 horas',
        gruposDeAtencion: 'Seguridad',
        precio: 0,
        activo: true
      }
    ];

    // Servicios LOCALES de empresas cliente (para tickets de empresas)
    const serviciosLocales = [
      {
        nombre: 'Reseteo de Contraseña Interna',
        alcance: 'local',
        empresa: testSA._id,
        tipo: 'Requerimiento',
        area: 'TI Interno',
        prioridad: 'Alta',
        descripcion: 'Solicitud para resetear la contraseña de sistemas internos.',
        sla: '2 horas',
        gruposDeAtencion: 'Soporte Local',
        precio: 0,
        activo: true
      },
      {
        nombre: 'Configuración de VPN',
        alcance: 'local',
        empresa: testSA._id,
        tipo: 'Requerimiento',
        area: 'Redes',
        prioridad: 'Alta',
        descripcion: 'Configuración de acceso VPN para trabajo remoto.',
        sla: '4 horas',
        gruposDeAtencion: 'Infraestructura',
        precio: 0,
        activo: true
      },
      {
        nombre: 'Instalación de Software',
        alcance: 'local',
        empresa: innovatech._id,
        tipo: 'Requerimiento',
        area: 'DevOps',
        prioridad: 'Media',
        descripcion: 'Solicitud de instalación de IDEs y herramientas.',
        sla: '8 horas',
        gruposDeAtencion: 'Soporte IT',
        precio: 0,
        activo: true
      },
      {
        nombre: 'Mantenimiento de Vehículo',
        alcance: 'local',
        empresa: globalLogistics._id,
        tipo: 'Mantenimiento',
        area: 'Flotilla',
        prioridad: 'Media',
        descripcion: 'Programación de servicio para unidad de transporte.',
        sla: '72 horas',
        gruposDeAtencion: 'Taller',
        precio: 0,
        activo: true
      }
    ];

    await Servicio.insertMany([...serviciosInternos, ...serviciosLocales]);

    // 3b. Crear Habilidades
    console.log('🧠 Creando Habilidades...');
    const habilidadesBase = [
      { nombre: 'Plataforma Aurontek', descripcion: 'Conocimiento sobre el funcionamiento interno de la plataforma.' },
      { nombre: 'Facturación', descripcion: 'Capacidad para resolver dudas sobre facturas y pagos.' },
      { nombre: 'Redes', descripcion: 'Administración de redes, VPN, firewalls.' },
      { nombre: 'Sistemas Locales', descripcion: 'Soporte a software y hardware en las instalaciones del cliente.' },
      { nombre: 'Soporte Básico', descripcion: 'Resolución de problemas de primer nivel.' },
      { nombre: 'Infraestructura', descripcion: 'Manejo de servidores, bases de datos y cloud.' },
      { nombre: 'DevOps', descripcion: 'CI/CD, Docker, Kubernetes' },
      { nombre: 'Ventas', descripcion: 'Gestión comercial y CRM' }
    ];
    await Habilidad.insertMany(habilidadesBase);

    // 4. Crear Usuarios con Permisos (User-Centric RBAC)
    console.log('👥 Creando usuarios...');

    const salt = await bcrypt.genSalt(10);
    const commonPass = await bcrypt.hash('Password123!', salt);
    const adminPass = await bcrypt.hash('P4r1s*2025', salt);

    // 4a. Crear Admins Generales (en colección `admins`)
    const adminsData = [
      {
        nombre: 'Ezequiel Perez',
        correo: 'eperez@aurontek.com',
        contraseña: adminPass,
        empresa: aurontekHQ._id,
        rol: 'admin-general',
        puesto: 'Super Admin',
        permisos: ['*'],  // Usar 'permisos' para admins
        activo: true
      },
      {
        nombre: 'Gabriel Moreno',
        correo: 'gmoreno@aurontek.com',
        contraseña: adminPass,
        empresa: aurontekHQ._id,
        rol: 'admin-general',
        puesto: 'Co-Founder & Admin',
        permisos: ['*'],  // Usar 'permisos' para admins
        activo: true
      }
    ];
    await Admin.insertMany(adminsData);
    console.log(`✅ Admins Generales creados: ${adminsData.map(a => a.correo).join(', ')}`);

    // 4b. Crear Usuarios (en colección `usuarios`)
    const usuariosData = [
      // Aurontek Staff
      {
        nombre: 'Agente Soporte',
        correo: 'soporte@aurontek.com',
        empresa: aurontekHQ._id,
        rol: 'soporte-plataforma',
        puesto: 'Agente N2',
        habilidades: ['Plataforma Aurontek', 'Facturación'],
        gruposDeAtencion: ['Mesa de Servicio', 'Soporte'],
        permissions: ['tickets.view_all_global', 'tickets.change_status', 'chat.read', 'chat.write', 'users.view_global'],
        estado_actividad: 'available'
      },
      {
        nombre: 'Ventas Aurontek',
        correo: 'ventas@aurontek.com',
        empresa: aurontekHQ._id,
        rol: 'soporte-plataforma', // Using generic support role for now or could create sales role
        puesto: 'Ejecutivo Ventas',
        habilidades: ['Ventas', 'Facturación'],
        gruposDeAtencion: ['Ventas'],
        permissions: ['tickets.view_all_global', 'chat.read', 'chat.write'],
        estado_actividad: 'busy'
      },
      // Test SA
      {
        nombre: 'Gerente Cliente',
        correo: 'gerente@testsa.com',
        empresa: testSA._id,
        rol: 'admin-interno',
        puesto: 'Gerente TI',
        gruposDeAtencion: ['Administración'],
        permissions: ['companies.view_all', 'users.view', 'users.create', 'tickets.create', 'tickets.view_all', 'servicios.manage_local', 'servicios.import', 'users.recover_password_local'],
        estado_actividad: 'offline'
      },
      {
        nombre: 'Empleado Cliente',
        correo: 'empleado@testsa.com',
        empresa: testSA._id,
        rol: 'cliente-final',
        puesto: 'Contador',
        gruposDeAtencion: [],
        permissions: ['tickets.create', 'tickets.view_created', 'chat.create'],
        estado_actividad: 'available'
      },
      // Innovatech
      {
        nombre: 'Admin Innovatech',
        correo: 'admin@innovatech.com',
        empresa: innovatech._id,
        rol: 'admin-interno',
        puesto: 'CTO',
        gruposDeAtencion: ['Administración', 'Soporte IT'],
        permissions: ['companies.view_all', 'users.create', 'tickets.create', 'tickets.view_all', 'servicios.manage_local'],
        estado_actividad: 'busy'
      },
      {
        nombre: 'Dev Frontend',
        correo: 'dev@innovatech.com',
        empresa: innovatech._id,
        rol: 'dev',
        puesto: 'Senior Developer',
        gruposDeAtencion: [],
        permissions: ['tickets.create', 'tickets.view_created'],
        estado_actividad: 'offline'
      },
      // Global Logistics
      {
        nombre: 'Admin Logistics',
        correo: 'admin@logistics.com',
        empresa: globalLogistics._id,
        rol: 'admin-interno',
        puesto: 'Gerente Operaciones',
        gruposDeAtencion: ['Administración', 'Taller'],
        permissions: ['companies.view_all', 'users.create', 'tickets.create'],
        estado_actividad: 'available'
      },
      // EcoEnergy
      {
        nombre: 'Admin Eco',
        correo: 'admin@ecoenergy.com',
        empresa: ecoEnergy._id,
        rol: 'admin-interno',
        puesto: 'Director',
        gruposDeAtencion: ['Administración'],
        permissions: ['companies.view_all', 'users.create', 'tickets.create'],
        estado_actividad: 'offline'
      }
    ];

    const usuariosToInsert = usuariosData.map((u) => {
      return {
        ...u,
        contraseña: commonPass
      };
    });

    await Usuario.insertMany(usuariosToInsert);

    console.log('✨ Seeding completado exitosamente!');
    console.log('-----------------------------------');
    console.log('Admins Sistema (Pass: P4r1s*2025):');
    adminsData.forEach(a => console.log(`- ${a.correo}`));
    console.log('Usuarios (Pass: Password123!):');
    usuariosData.forEach(u => console.log(`- ${u.correo} (${u.empresa})`));
    console.log('-----------------------------------');

  } catch (error) {
    console.error('❌ Error durante el seeding:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();