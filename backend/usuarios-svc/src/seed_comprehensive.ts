import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import Usuario from './Models/AltaUsuario.models';
import Role from './Models/Role.model';
import { Empresa } from './Models/AltaEmpresas.models';

// --- LOGGING ---
const log = (msg: string) => {
    console.log(msg);
    fs.appendFileSync('seed_log.txt', msg + '\n');
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

// Override for this specific run as requested by user if needed, but the above fallback works if .env is missing.
// However, to be sure, let's log it.
console.log(`Using URI: ${MONGODB_URI}`);

// --- DATA DEFINITIONS ---

const PERMISOS_ADMIN_INTERNO = [
    'dashboard.view',
    'users.view', 'users.create', 'users.update', 'users.delete',
    'tickets.view_all', 'tickets.update', 'tickets.assign',
    'reports.view'
];

const PERMISOS_SOPORTE = [
    'dashboard.view',
    'tickets.view_assigned', 'tickets.update',
    'tickets.view_unassigned', 'tickets.pickup'
];

const PERMISOS_USUARIO = [
    'tickets.create', 'tickets.view_own', 'tickets.create_global', 'tickets.view_global_services'
];

const DATA = {
    empresa: {
        nombre: 'Aurontek HQ',
        rfc: 'AUR20240101HQ1',
        correo: 'contacto@aurontek.com',
        codigo_acceso: 'AURONTEK2026',
        plan: 'Anual'
    },
    roles: [
        { nombre: 'Administrador Interno', slug: 'admin-interno', nivel: 50, permisos: PERMISOS_ADMIN_INTERNO },
        { nombre: 'Soporte Técnico', slug: 'soporte', nivel: 20, permisos: PERMISOS_SOPORTE },
        { nombre: 'Usuario Final', slug: 'usuario', nivel: 10, permisos: PERMISOS_USUARIO }
    ],
    usuarios: [
        {
            nombre: 'Admin Aurontek',
            correo: 'admin.aurontek@aurontek.com',
            pass: 'Admin123!',
            rolSlug: 'admin-interno',
            grupos: ['Mesa de Servicio', 'Soporte Ti', 'DevOps']
        },
        {
            nombre: 'Agente Mesa Ayuda',
            correo: 'agente.mesa@aurontek.com',
            pass: 'Soporte123!',
            rolSlug: 'soporte',
            grupos: ['Mesa de Servicio']
        },
        {
            nombre: 'Agente Infraestructura',
            correo: 'agente.ti@aurontek.com',
            pass: 'Soporte123!',
            rolSlug: 'soporte',
            grupos: ['Soporte Ti']
        },
        {
            nombre: 'Usuario Empleado',
            correo: 'empleado@aurontek.com',
            pass: 'User123!',
            rolSlug: 'usuario',
            grupos: []
        }
    ]
};

const seed = async () => {
    try {
        fs.writeFileSync('seed_log.txt', 'INIT SEED\n');
        if (!MONGODB_URI) throw new Error('MONGODB_URI missing');
        await mongoose.connect(MONGODB_URI);
        log(`✅ Conectado a BD: ${MONGODB_URI.split('@')[1]}`);

        // 1. EMPRESA
        let empresa = await Empresa.findOne({ rfc: DATA.empresa.rfc });
        if (!empresa) {
            // Buscar por nombre si no encuentra por RFC (para evitar duplicados por cambios manuales)
            empresa = await Empresa.findOne({ nombre: DATA.empresa.nombre });
        }

        if (empresa) {
            log(`🏢 Empresa existente: ${empresa.nombre}`);
        } else {
            empresa = await Empresa.create({
                ...DATA.empresa,
                fecha_inicio: new Date(),
                licencia: [{
                    fecha_inicio: new Date(),
                    plan: DATA.empresa.plan,
                    estado: true
                }]
            });
            log(`✅ Empresa creada: ${empresa.nombre}`);
        }

        const empresaId = empresa._id;

        // 2. ROLES
        for (const rolData of DATA.roles) {
            // Buscamos por slug O por nombre para evitar duplicados de nombre
            let rol = await Role.findOne({
                $or: [
                    { slug: rolData.slug, empresa: empresaId },
                    { nombre: rolData.nombre, empresa: empresaId }
                ]
            });

            if (rol) {
                rol.permisos = rolData.permisos;
                rol.nivel = rolData.nivel;
                rol.slug = rolData.slug; // Aseguramos que el slug sea el correcto
                await rol.save();
                log(`   🔸 Rol actualizado: ${rolData.nombre}`);
            } else {
                await Role.create({
                    ...rolData,
                    empresa: empresaId,
                    descripcion: `Rol de ${rolData.nombre} para ${DATA.empresa.nombre}`
                });
                log(`   🔹 Rol creado: ${rolData.nombre}`);
            }
        }

        // 3. USUARIOS
        for (const usrData of DATA.usuarios) {
            const userExists = await Usuario.findOne({ correo: usrData.correo });

            if (userExists) {
                // Update
                userExists.empresa = empresaId;
                userExists.gruposDeAtencion = usrData.grupos;
                userExists.rol = usrData.rolSlug;

                await userExists.save();
                log(`   👤 Usuario actualizado: ${usrData.correo}`);
            } else {
                await Usuario.create({
                    nombre: usrData.nombre,
                    correo: usrData.correo,
                    contraseña: usrData.pass,
                    rol: usrData.rolSlug,
                    empresa: empresaId,
                    gruposDeAtencion: usrData.grupos,
                    puesto: 'Empleado Test',
                    activo: true
                });
                log(`   ✨ Usuario creado: ${usrData.correo}`);
            }
        }

        log('\n🔍 Verifying persisted data...');
        const finalUsers = await Usuario.find({ empresa: empresaId });
        log(`📊 Users found for company ${DATA.empresa.nombre}: ${finalUsers.length}`);
        finalUsers.forEach(u => log(`   - ${u.correo} (${u.rol})`));

        log('\n🏁 Seed completado exitosamente.');
        process.exit(0);

    } catch (error: any) {
        log(`❌ Error crítico: ${error.message}`);
        process.exit(1);
    }
};

seed();
