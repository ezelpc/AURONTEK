/**
 * SEED SCRIPT - Test Data con Permisos Granulares RBAC
 * 
 * Genera datos de prueba para probar:
 * - Permisos granulares (users.create, tickets.view_all_global, etc)
 * - Usuarios con diferentes niveles de acceso
 * - Empresas de prueba
 * - Roles con permisos específicos
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import Usuario from './Models/AltaUsuario.models';
import Role from './Models/Role.model';
import { Empresa } from './Models/AltaEmpresas.models';
import { PERMISOS, PERMISOS_LOCALES_ADMIN, PERMISOS_SOPORTE_GLOBAL, PERMISOS_USUARIO_FINAL } from './Constants/permissions';

// --- LOGGING ---
const logFile = 'seed_rbac_test.log';
const log = (msg: string) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
};

// --- CONFIG ---
const ENV = process.env.NODE_ENV || 'development';
if (ENV === 'development') {
    const rootEnvPath = path.resolve(__dirname, '../../../.env');
    const localEnvPath = path.resolve(__dirname, '../.env');
    dotenv.config({ path: rootEnvPath });
    dotenv.config({ path: localEnvPath });
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aurontek';

// --- DATA DEFINITIONS ---

const DATA = {
    empresas: [
        {
            nombre: 'Aurontek HQ',
            rfc: 'AUR20240101HQ1',
            correo: 'contacto@aurontek.com',
            codigo_acceso: 'AURONTEK2026',
            plan: 'Enterprise'
        },
        {
            nombre: 'Empresa Test A',
            rfc: 'ETM20240101A01',
            correo: 'admin@empresatesta.com',
            codigo_acceso: 'EMPRESA_A_2026',
            plan: 'Professional'
        },
        {
            nombre: 'Empresa Test B',
            rfc: 'ETM20240101B02',
            correo: 'admin@empresatestb.com',
            codigo_acceso: 'EMPRESA_B_2026',
            plan: 'Starter'
        }
    ],

    roles_globales: [
        {
            nombre: 'Super Admin',
            slug: 'admin-general',
            nivel: 100,
            permisos: ['*'], // Total access
            descripcion: 'Acceso total al sistema'
        },
        {
            nombre: 'Admin Subroot',
            slug: 'admin-subroot',
            nivel: 90,
            permisos: [
                // Usuarios
                PERMISOS.USERS_VIEW_GLOBAL,
                PERMISOS.USERS_CREATE,
                PERMISOS.USERS_UPDATE,
                PERMISOS.USERS_DELETE,
                // Empresas
                PERMISOS.COMPANIES_VIEW_ALL,
                PERMISOS.COMPANIES_CREATE,
                PERMISOS.COMPANIES_UPDATE,
                PERMISOS.COMPANIES_DELETE,
                PERMISOS.COMPANIES_SUSPEND,
                // Tickets Global
                PERMISOS.TICKETS_VIEW_ALL_GLOBAL,
                PERMISOS.TICKETS_ASSIGN_GLOBAL,
                PERMISOS.TICKETS_EDIT_GLOBAL,
                PERMISOS.TICKETS_CHANGE_STATUS_GLOBAL,
                PERMISOS.TICKETS_CHANGE_PRIORITY_GLOBAL,
                PERMISOS.TICKETS_DELETE_GLOBAL,
                // Servicios
                PERMISOS.SERVICIOS_CREATE_GLOBAL,
                PERMISOS.SERVICIOS_EDIT_GLOBAL,
                PERMISOS.SERVICIOS_DELETE_GLOBAL,
                // Roles
                PERMISOS.ROLES_CREATE,
                PERMISOS.ROLES_EDIT,
                PERMISOS.ROLES_DELETE,
                // Admins
                PERMISOS.ADMINS_CREATE,
                PERMISOS.ADMINS_VIEW,
                PERMISOS.ADMINS_EDIT,
                PERMISOS.ADMINS_DELETE,
                // Habilidades
                PERMISOS.HABILITIES_CREATE,
                PERMISOS.HABILITIES_EDIT,
                PERMISOS.HABILITIES_DELETE
            ],
            descripcion: 'Administrador del sistema (segundo nivel)'
        },
        {
            nombre: 'Soporte Global',
            slug: 'soporte-global',
            nivel: 50,
            permisos: [
                PERMISOS.TICKETS_VIEW_ALL_GLOBAL,
                PERMISOS.TICKETS_ASSIGN_GLOBAL,
                PERMISOS.TICKETS_EDIT_GLOBAL,
                PERMISOS.TICKETS_CHANGE_STATUS_GLOBAL,
                PERMISOS.TICKETS_CHANGE_PRIORITY_GLOBAL,
                PERMISOS.USERS_VIEW_GLOBAL,
            ],
            descripcion: 'Soporte técnico global'
        }
    ],

    roles_locales: [
        {
            nombre: 'Admin Empresa',
            slug: 'admin-empresa',
            nivel: 80,
            permisos: PERMISOS_LOCALES_ADMIN,
            descripcion: 'Administrador de la empresa'
        },
        {
            nombre: 'Soporte Técnico',
            slug: 'soporte',
            nivel: 30,
            permisos: [
                PERMISOS.TICKETS_VIEW_ALL,
                PERMISOS.TICKETS_CHANGE_STATUS,
                PERMISOS.TICKETS_ASSIGN,
                PERMISOS.TICKETS_DELEGATE,
                PERMISOS.USERS_VIEW
            ],
            descripcion: 'Soporte técnico local'
        },
        {
            nombre: 'Usuario Final',
            slug: 'usuario',
            nivel: 10,
            permisos: [
                PERMISOS.TICKETS_CREATE,
                PERMISOS.TICKETS_VIEW_CREATED,
                PERMISOS.TICKETS_RATE
            ],
            descripcion: 'Usuario final - solo crear tickets'
        }
    ],

    usuarios_aurontek_hq: [
        {
            nombre: 'Admin General Aurontek',
            correo: 'admin.general@aurontek.com',
            pass: 'Admin123!',
            rol: 'admin-general',
            puesto: 'Super Admin',
            grupos: ['DevOps', 'Sistema']
        },
        {
            nombre: 'Admin Subroot',
            correo: 'admin.subroot@aurontek.com',
            pass: 'Subroot123!',
            rol: 'admin-subroot',
            puesto: 'Administrador del Sistema',
            grupos: ['Administración', 'Soporte Global']
        },
        {
            nombre: 'Soporte Global Tech',
            correo: 'soporte.global@aurontek.com',
            pass: 'Soporte123!',
            rol: 'soporte-global',
            puesto: 'Especialista Soporte Global',
            grupos: ['Soporte Global']
        }
    ],

    usuarios_empresa_a: [
        {
            nombre: 'Admin Empresa Test A',
            correo: 'admin@empresatesta.com',
            pass: 'AdminA123!',
            rol: 'admin-empresa',
            puesto: 'Administrador',
            grupos: ['Administración']
        },
        {
            nombre: 'Soporte Empresa A',
            correo: 'soporte@empresatesta.com',
            pass: 'SoporteA123!',
            rol: 'soporte',
            puesto: 'Técnico Soporte',
            grupos: ['Mesa de Servicio', 'Soporte TI']
        },
        {
            nombre: 'Empleado Empresa A',
            correo: 'empleado@empresatesta.com',
            pass: 'EmpleadoA123!',
            rol: 'usuario',
            puesto: 'Empleado',
            grupos: []
        }
    ],

    usuarios_empresa_b: [
        {
            nombre: 'Admin Empresa Test B',
            correo: 'admin@empresatestb.com',
            pass: 'AdminB123!',
            rol: 'admin-empresa',
            puesto: 'Administrador',
            grupos: ['Administración']
        },
        {
            nombre: 'Soporte Empresa B',
            correo: 'soporte@empresatestb.com',
            pass: 'SoporteB123!',
            rol: 'soporte',
            puesto: 'Técnico Soporte',
            grupos: ['Mesa de Servicio']
        }
    ]
};

const seed = async () => {
    try {
        // Clear log file
        fs.writeFileSync(logFile, `=== SEED RBAC TEST ===\n${new Date().toISOString()}\n\n`);

        if (!MONGODB_URI) throw new Error('MONGODB_URI missing');
        await mongoose.connect(MONGODB_URI);
        log(`✅ Conectado a BD: ${MONGODB_URI.split('@')[1] || MONGODB_URI}`);

        // === 1. LIMPIAR DATOS PREVIOS ===
        log('\n📋 Limpiando datos previos...');

        // No eliminar todo, solo los datos de prueba
        const preexistingCompanies = await Empresa.find({});
        if (preexistingCompanies.length > 0) {
            log(`   Encontradas ${preexistingCompanies.length} empresas existentes`);
        }

        // === 2. CREAR EMPRESAS ===
        log('\n🏢 Creando empresas...');
        const empresas: any = {};

        for (const empData of DATA.empresas) {
            let empresa = await Empresa.findOne({ rfc: empData.rfc });

            if (empresa) {
                log(`   ✓ Empresa existente: ${empresa.nombre} (${empresa._id})`);
            } else {
                empresa = await Empresa.create({
                    ...empData,
                    fecha_inicio: new Date(),
                    activo: true,
                    licencia: [{
                        fecha_inicio: new Date(),
                        plan: empData.plan,
                        estado: true
                    }]
                });
                log(`   ✨ Empresa creada: ${empresa.nombre}`);
            }

            empresas[empData.rfc] = empresa._id;
        }

        // === 3. CREAR ROLES GLOBALES (sin empresa) ===
        log('\n👥 Creando roles globales...');

        for (const rolData of DATA.roles_globales) {
            let rol = await Role.findOne({
                slug: rolData.slug,
                empresa: { $exists: false }
            });

            if (rol) {
                rol.permisos = rolData.permisos;
                rol.nivel = rolData.nivel;
                await rol.save();
                log(`   ✓ Rol global actualizado: ${rolData.nombre}`);
            } else {
                await Role.create({
                    ...rolData,
                    descripcion: rolData.descripcion
                    // Sin empresa = rol global
                });
                log(`   ✨ Rol global creado: ${rolData.nombre}`);
            }
        }

        // === 4. CREAR ROLES LOCALES POR EMPRESA ===
        log('\n👥 Creando roles locales por empresa...');

        const empresaAId = empresas['ETM20240101A01'];
        const empresaBId = empresas['ETM20240101B02'];

        for (const empresa of [
            { id: empresaAId, name: 'Empresa A' },
            { id: empresaBId, name: 'Empresa B' }
        ]) {
            for (const rolData of DATA.roles_locales) {
                let rol = await Role.findOne({
                    slug: rolData.slug,
                    empresa: empresa.id
                });

                if (rol) {
                    rol.permisos = rolData.permisos;
                    await rol.save();
                    log(`   ✓ Rol local actualizado: ${rolData.nombre} (${empresa.name})`);
                } else {
                    await Role.create({
                        ...rolData,
                        empresa: empresa.id,
                        descripcion: `${rolData.descripcion} - ${empresa.name}`
                    });
                    log(`   ✨ Rol local creado: ${rolData.nombre} (${empresa.name})`);
                }
            }
        }

        // === 5. CREAR USUARIOS AURONTEK HQ ===
        log('\n👤 Creando usuarios Aurontek HQ...');
        const aurontekId = empresas['AUR20240101HQ1'];

        for (const usrData of DATA.usuarios_aurontek_hq) {
            let user = await Usuario.findOne({ correo: usrData.correo });

            if (user) {
                // Update password y otros datos
                user.nombre = usrData.nombre;
                user.rol = usrData.rol;
                user.puesto = usrData.puesto;
                user.gruposDeAtencion = usrData.grupos;
                user.empresa = usrData.rol === 'admin-general' ? undefined : aurontekId;
                user.activo = true;
                await user.save();
                log(`   ✓ Usuario actualizado: ${usrData.correo} (${usrData.rol})`);
            } else {
                await Usuario.create({
                    nombre: usrData.nombre,
                    correo: usrData.correo,
                    contraseña: usrData.pass,
                    rol: usrData.rol,
                    empresa: usrData.rol === 'admin-general' ? undefined : aurontekId,
                    puesto: usrData.puesto,
                    gruposDeAtencion: usrData.grupos,
                    activo: true
                });
                log(`   ✨ Usuario creado: ${usrData.correo} (${usrData.rol})`);
            }
        }

        // === 6. CREAR USUARIOS EMPRESA A ===
        log('\n👤 Creando usuarios Empresa Test A...');

        for (const usrData of DATA.usuarios_empresa_a) {
            let user = await Usuario.findOne({ correo: usrData.correo });

            if (user) {
                user.nombre = usrData.nombre;
                user.rol = usrData.rol;
                user.puesto = usrData.puesto;
                user.gruposDeAtencion = usrData.grupos;
                user.empresa = empresaAId;
                user.activo = true;
                await user.save();
                log(`   ✓ Usuario actualizado: ${usrData.correo} (${usrData.rol})`);
            } else {
                await Usuario.create({
                    nombre: usrData.nombre,
                    correo: usrData.correo,
                    contraseña: usrData.pass,
                    rol: usrData.rol,
                    empresa: empresaAId,
                    puesto: usrData.puesto,
                    gruposDeAtencion: usrData.grupos,
                    activo: true
                });
                log(`   ✨ Usuario creado: ${usrData.correo} (${usrData.rol})`);
            }
        }

        // === 7. CREAR USUARIOS EMPRESA B ===
        log('\n👤 Creando usuarios Empresa Test B...');

        for (const usrData of DATA.usuarios_empresa_b) {
            let user = await Usuario.findOne({ correo: usrData.correo });

            if (user) {
                user.nombre = usrData.nombre;
                user.rol = usrData.rol;
                user.puesto = usrData.puesto;
                user.gruposDeAtencion = usrData.grupos;
                user.empresa = empresaBId;
                user.activo = true;
                await user.save();
                log(`   ✓ Usuario actualizado: ${usrData.correo} (${usrData.rol})`);
            } else {
                await Usuario.create({
                    nombre: usrData.nombre,
                    correo: usrData.correo,
                    contraseña: usrData.pass,
                    rol: usrData.rol,
                    empresa: empresaBId,
                    puesto: usrData.puesto,
                    gruposDeAtencion: usrData.grupos,
                    activo: true
                });
                log(`   ✨ Usuario creado: ${usrData.correo} (${usrData.rol})`);
            }
        }

        // === 8. VERIFICAR DATOS CREADOS ===
        log('\n🔍 Verificando datos creados...');

        const allUsers = await Usuario.find({});
        log(`\n📊 Total de usuarios creados: ${allUsers.length}`);
        log('\n=== USUARIOS POR EMPRESA ===');

        for (const empData of DATA.empresas) {
            const empId = empresas[empData.rfc];
            const users = await Usuario.find({
                $or: [
                    { empresa: empId },
                    { rol: 'admin-general' } // admin-general sin empresa
                ]
            });

            log(`\n${empData.nombre}:`);
            users.forEach(u => {
                log(`   - ${u.correo}`);
                log(`     ├─ Rol: ${u.rol}`);
                log(`     ├─ Puesto: ${u.puesto}`);
                log(`     └─ Activo: ${u.activo}`);
            });
        }

        log('\n✅ SEED completado exitosamente');
        log('\n=== CREDENCIALES DE PRUEBA ===');
        log('\nAurontek HQ:');
        log('  Admin General: admin.general@aurontek.com / Admin123!');
        log('  Admin Subroot: admin.subroot@aurontek.com / Subroot123!');
        log('  Soporte Global: soporte.global@aurontek.com / Soporte123!');

        log('\nEmpresa A:');
        log('  Admin: admin@empresatesta.com / AdminA123!');
        log('  Soporte: soporte@empresatesta.com / SoporteA123!');
        log('  Empleado: empleado@empresatesta.com / EmpleadoA123!');

        log('\nEmpresa B:');
        log('  Admin: admin@empresatestb.com / AdminB123!');
        log('  Soporte: soporte@empresatestb.com / SoporteB123!');

        log('\n📁 Log guardado en: ' + logFile);

        await mongoose.connection.close();
        process.exit(0);

    } catch (error: any) {
        log(`\n❌ Error: ${error.message}`);
        log(`Stack: ${error.stack}`);
        process.exit(1);
    }
};

seed();
