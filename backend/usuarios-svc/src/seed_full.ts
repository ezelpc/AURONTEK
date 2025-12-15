import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcrypt';
import { Empresa } from './Models/AltaEmpresas.models';
import Usuario from './Models/AltaUsuario.models';
import Role from './Models/Role.model';
import { PERMISSIONS } from './Constants/permissions';

// Cargar .env
const envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI;

const seed = async () => {
    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI no definida');
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado a MongoDB para Seeding...');

        // 1. Limpiar Colecciones (Solo datos de prueba)
        console.log('🧹 Limpiando colecciones...');
        await Usuario.deleteMany({ correo: { $regex: /@empresa\.com$/ } }); // Solo borrar test users
        await Empresa.deleteMany({ rfc: { $in: ['TST123456789', 'AURONTEK001'] } });
        await Role.deleteMany({ slug: { $in: ['admin-general', 'admin-subroot', 'resolutor-interno', 'soporte-plataforma', 'admin-interno', 'cliente-final', 'becario', 'soporte'] } });
        // Borrar servicios es peligroso si hay otros, pero borremos los de prueba
        await mongoose.connection.collection('servicios').deleteMany({ nombre: { $in: ['VPN Access', 'Correo Corporativo', 'Licencia Software', 'Mantenimiento PC', 'Acceso SAP'] } });

        // 2a. Crear Empresa de Prueba (Cliente)
        console.log('🏢 Creando Empresa Cliente...');
        const empresa = await Empresa.create({
            nombre: 'Empresa Test S.A.',
            rfc: 'TST123456789',
            correo: 'contacto@empresa.com',
            codigo_acceso: 'Acme2024',
            direccion: 'Calle Falsa 123',
            telefono: '555-555-5555',
            licencia: [{
                fecha_inicio: new Date(),
                plan: 'Anual',
                estado: true
            }],
            contratantes: [{ nombre: 'Contacto Empresa Test', correo: 'admin@empresa.com', telefono: '555-555-5555', puesto: 'Gerente TI' }]
        });

        // 2b. Crear Empresa Sistema (Gateway para Admin General)
        const aurontek = await Empresa.create({
            nombre: 'Aurontek HQ',
            rfc: 'AURONTEK001',
            correo: 'admin@aurontek.com',
            codigo_acceso: 'Auro2024',
            direccion: 'HQ Principal',
            telefono: '000-000-0000',
            licencia: [{ fecha_inicio: new Date(), plan: 'Anual', estado: true }],
            contratantes: [{ nombre: 'Admin System Contact', correo: 'admin@aurontek.com', telefono: '000-000-0000', puesto: 'System Owner' }]
        });

        // 3. Crear ROLES BASE
        console.log('🛡️ Creando Roles Base...');
        const baseRoles = [
            // --- SYSTEM ROLES (Aurontek HQ) ---
            {
                nombre: 'Admin General',
                slug: 'admin-general',
                descripcion: 'Super Admin del Sistema (Acceso Total)',
                empresa: aurontek._id,
                permisos: ['*'], // Bypass in middleware handles this, but explicit here helps UI
                nivel: 100
            },
            {
                nombre: 'Admin Subroot',
                slug: 'admin-subroot',
                descripcion: 'Admin Sistema Limitado',
                empresa: aurontek._id,
                permisos: [
                    PERMISSIONS.TICKETS_VIEW_ALL, PERMISSIONS.TICKETS_EDIT, PERMISSIONS.TICKETS_DELETE,
                    PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_EDIT,
                    PERMISSIONS.ROLES_VIEW, PERMISSIONS.ROLES_MANAGE,
                    PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.COMPANY_MANAGE
                ],
                nivel: 90
            },
            {
                nombre: 'Soporte Plataforma',
                slug: 'soporte-plataforma',
                descripcion: 'Soporte N2 - Atiende tickets de clientes',
                empresa: aurontek._id,
                permisos: [
                    PERMISSIONS.TICKETS_VIEW_ALL,
                    PERMISSIONS.TICKETS_EDIT,
                    PERMISSIONS.TICKETS_ASSIGN,
                    PERMISSIONS.USERS_VIEW, // Read-only view of client users
                    PERMISSIONS.DASHBOARD_VIEW
                ],
                nivel: 50
            },
            {
                nombre: 'Resolutor Interno',
                slug: 'resolutor-interno',
                descripcion: 'Soporte Técnico Interno de Aurontek',
                empresa: aurontek._id,
                permisos: [
                    PERMISSIONS.TICKETS_VIEW_ASSIGNED, // Or View All but limited
                    PERMISSIONS.TICKETS_EDIT,
                    PERMISSIONS.DASHBOARD_VIEW
                ],
                nivel: 50
            },

            // --- CLIENT COMPANY ROLES ---
            {
                nombre: 'Admin Interno',
                slug: 'admin-interno',
                descripcion: 'Administrador total de la Empresa Cliente',
                empresa: empresa._id,
                permisos: [
                    // Users
                    PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_EDIT, PERMISSIONS.USERS_DELETE,
                    // Roles
                    PERMISSIONS.ROLES_VIEW, PERMISSIONS.ROLES_MANAGE,
                    // Tickets
                    PERMISSIONS.TICKETS_VIEW_COMPANY, // See company tickets
                    PERMISSIONS.TICKETS_CREATE, PERMISSIONS.TICKETS_EDIT, PERMISSIONS.TICKETS_DELETE, PERMISSIONS.TICKETS_ASSIGN,
                    // Misc
                    PERMISSIONS.DASHBOARD_VIEW,
                    PERMISSIONS.HABILITIES_VIEW
                ],
                nivel: 50
            },
            {
                nombre: 'Resolutor Empresa',
                slug: 'resolutor-empresa',
                descripcion: 'Técnico de soporte de la empresa',
                empresa: empresa._id,
                permisos: [
                    PERMISSIONS.TICKETS_VIEW_ASSIGNED, // See assigned tickets
                    PERMISSIONS.TICKETS_EDIT,          // Update tickets
                    PERMISSIONS.DASHBOARD_VIEW
                ],
                nivel: 40
            },
            {
                nombre: 'Usuario Final', // Renamed from Cliente Final
                slug: 'cliente-final',   // Keep slug for compatibility or update to 'usuario-final'? Let's keep 'cliente-final' for now to match users.
                descripcion: 'Empleado que reporta incidentes',
                empresa: empresa._id,
                permisos: [
                    PERMISSIONS.TICKETS_VIEW_OWN,
                    PERMISSIONS.TICKETS_CREATE
                ],
                nivel: 10
            },
            {
                nombre: 'Soporte', // Legacy compat
                slug: 'soporte',
                descripcion: 'Rol de soporte legacy',
                empresa: empresa._id,
                permisos: [
                    PERMISSIONS.TICKETS_VIEW_COMPANY,
                    PERMISSIONS.TICKETS_EDIT
                ],
                nivel: 40
            },
            {
                nombre: 'Becario', // Legacy compat
                slug: 'becario',
                descripcion: 'Rol de becario legacy',
                empresa: empresa._id,
                permisos: [
                    PERMISSIONS.TICKETS_VIEW_OWN,
                    PERMISSIONS.TICKETS_CREATE
                ],
                nivel: 5
            }
        ];

        for (const role of baseRoles) {
            const existing = await Role.findOne({ slug: role.slug, empresa: role.empresa });
            if (!existing) {
                await Role.create(role);
            } else {
                // Update permissions just in case
                existing.permisos = role.permisos;
                await existing.save();
            }
        }


        // 4. Crear Usuarios
        console.log('👥 Creando Usuarios y Admins...');

        // 3a. Admin General (Colección Admin) - Vinculado a Aurontek
        const adminData = {
            nombre: 'Admin General',
            correo: 'admin@aurontek.com',
            contraseña: 'password123',
            rol: 'admin-general',
            empresa: aurontek._id, // LINKED TO AURONTEK
            activo: true
        };

        const adminExists = await import('./Models/Admin.model').then(m => m.default.findOne({ correo: adminData.correo }));
        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            adminData.contraseña = await bcrypt.hash(adminData.contraseña, salt);
            await import('./Models/Admin.model').then(m => m.default.create(adminData));
            console.log('✅ Admin General creado en colección admins (Vinculado a Aurontek)');
        }

        // 3b. Usuarios (Colección Usuario)
        const users = [
            // --- AURONTEK INTERNAL STAFF ---
            {
                nombre: 'Resolutor Interno',
                correo: 'resolutor@aurontek.com',
                contraseña: 'password123',
                rol: 'resolutor-interno',
                empresa: aurontek._id,
                puesto: 'Ops Internas',
                habilidades: ['Infraestructura', 'Redes Internas'], // NEW: Skills
                activo: true
            },
            {
                nombre: 'Soporte Plataforma',
                correo: 'soporte@aurontek.com',
                contraseña: 'password123',
                rol: 'soporte-plataforma',
                empresa: aurontek._id,
                puesto: 'Agent N2',
                habilidades: ['Plataforma Aurontek', 'Facturación'], // NEW: Skills
                activo: true
            },
            // --- CLIENT COMPANY STAFF ---
            {
                nombre: 'Admin Interno',
                correo: 'admin@empresa.com',
                contraseña: 'password123',
                rol: 'admin-interno',
                empresa: empresa._id,
                activo: true
            },
            {
                nombre: 'Resolutor Empresa Test',
                correo: 'resolutor@empresa.com',
                contraseña: 'password123',
                rol: 'resolutor-empresa',
                empresa: empresa._id,
                habilidades: ['Sistemas Locales'],
                puesto: 'IT Support Local',
                activo: true
            },
            {
                nombre: 'Usuario Final',
                correo: 'user@empresa.com',
                contraseña: 'password123',
                rol: 'cliente-final', // Updated slug
                empresa: empresa._id,
                puesto: 'Contador',
                activo: true
            },
            {
                nombre: 'Becario Soporte',
                correo: 'beca@empresa.com',
                contraseña: 'password123',
                rol: 'becario', // Updated slug
                empresa: empresa._id,
                habilidades: ['Soporte Básico'],
                puesto: 'Becario TI',
                activo: true
            }
        ];

        for (const u of users) {
            // Hash password manually here if using updateOne/findOneAndUpdate as pre-save hooks might not fire on update
            // But we are using a simple lookup. Let's rely on model or hash it here.
            // Usually findOneAndUpdate DOES NOT trigger pre('save').
            // So let's hash it.
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(u.contraseña, salt);
            u.contraseña = hash;

            await Usuario.findOneAndUpdate({ correo: u.correo }, u, { upsert: true, new: true, setDefaultsOnInsert: true });
        }

        // 5. Crear Servicios
        console.log('🛠️ Creando Servicios...');
        const servicios = [
            {
                nombre: 'VPN Access',
                tipo: 'Requerimiento',
                categoria: 'Conectividad',
                prioridad: 'Alta',
                descripcion: 'Solicitud de acceso remoto VPN',
                sla: '4 horas',
                gruposDeAtencion: 'Redes'
            },
            {
                nombre: 'Correo Corporativo',
                tipo: 'Requerimiento',
                categoria: 'Cuentas',
                prioridad: 'Media',
                descripcion: 'Creación o modificación de email',
                sla: '8 horas',
                gruposDeAtencion: 'Soporte Técnico'
            },
            {
                nombre: 'Licencia Software',
                tipo: 'Requerimiento',
                categoria: 'Software',
                prioridad: 'Media',
                descripcion: 'Solicitud de licencia (Office, Adobe, etc)',
                sla: '24 horas',
                gruposDeAtencion: 'Soporte Técnico'
            },
            {
                nombre: 'Mantenimiento PC',
                tipo: 'Incidente',
                categoria: 'Hardware',
                prioridad: 'Media',
                descripcion: 'Limpieza o reparación de equipo físico',
                sla: '48 horas',
                gruposDeAtencion: 'Soporte Técnico'
            },
            {
                nombre: 'Falla Critica Servidor',
                tipo: 'Incidente',
                categoria: 'Infraestructura',
                prioridad: 'Critica',
                descripcion: 'Servidor fuera de línea',
                sla: '1 hora',
                gruposDeAtencion: 'Infraestructura'
            }
        ];

        // Usamos insertMany ignorando duplicados si es posible o borrar/recrear
        // Ya borramos arriba
        await mongoose.connection.collection('servicios').insertMany(servicios);

        console.log('✨ Seed Finalizado Exitosamente');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error en Seed:', error);
        process.exit(1);
    }
};

seed();
