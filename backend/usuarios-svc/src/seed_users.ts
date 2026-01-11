import Usuario from './Models/AltaUsuario.models';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const usuarios = [
    {
        nombre: 'Ana López',
        correo: 'alopez@aurontek.com',
        password: 'Aurontek2024!',
        telefono: '5551234567',
        puesto: 'Soporte N2',
        rol: 'Soporte',
        empresa: '6942f22afad205160277e1ff',
        gruposDeAtencion: ['Mesa de Servicio', 'Soporte Técnico'],
        permisos: ['tickets.view', 'tickets.edit', 'tickets.assign', 'tickets.create']
    },
    {
        nombre: 'Carlos Mendoza',
        correo: 'cmendoza@aurontek.com',
        password: 'Aurontek2024!',
        telefono: '5551234568',
        puesto: 'Resolutor Técnico',
        rol: 'resolutor-empresa',
        empresa: '6942f22afad205160277e1ff',
        gruposDeAtencion: ['Soporte Técnico'],
        permisos: ['tickets.view', 'tickets.edit', 'tickets.assign', 'tickets.create']
    },
    {
        nombre: 'María Torres',
        correo: 'mtorres@aurontek.com',
        password: 'Aurontek2024!',
        telefono: '5551234569',
        puesto: 'Analista de Seguridad',
        rol: 'Soporte',
        empresa: '6942f22afad205160277e1ff',
        gruposDeAtencion: ['Seguridad'],
        permisos: ['tickets.view', 'tickets.edit', 'tickets.assign', 'tickets.create']
    },
    {
        nombre: 'Luis Ramírez',
        correo: 'lramirez@aurontek.com',
        password: 'Aurontek2024!',
        telefono: '5551234570',
        puesto: 'Becario Soporte',
        rol: 'beca-soporte',
        empresa: '6942f22afad205160277e1ff',
        gruposDeAtencion: ['Mesa de Servicio'],
        permisos: ['tickets.view', 'tickets.edit', 'tickets.create']
    },
    {
        nombre: 'Patricia Gómez',
        correo: 'pgomez@aurontek.com',
        password: 'Aurontek2024!',
        telefono: '5551234571',
        puesto: 'Administradora Interna',
        rol: 'admin-interno',
        empresa: '6942f22afad205160277e1ff',
        gruposDeAtencion: ['Infraestructura', 'Seguridad'],
        permisos: ['*']
    }
];

async function seed() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aurontek';
        await mongoose.connect(mongoUri);
        console.log('✅ Conectado a MongoDB');

        const salt = await bcrypt.genSalt(10);
        let created = 0;
        let updated = 0;

        for (const usuario of usuarios) {
            const hashedPassword = await bcrypt.hash(usuario.password, salt);

            const existing = await Usuario.findOne({ correo: usuario.correo });

            if (existing) {
                await Usuario.findByIdAndUpdate(existing._id, {
                    nombre: usuario.nombre,
                    telefono: usuario.telefono,
                    puesto: usuario.puesto,
                    rol: usuario.rol,
                    empresa: new mongoose.Types.ObjectId(usuario.empresa),
                    gruposDeAtencion: usuario.gruposDeAtencion,
                    permisos: usuario.permisos,
                    activo: true,
                    estado_actividad: 'offline'
                });
                updated++;
                console.log(`📝 Actualizado: ${usuario.nombre} (${usuario.correo})`);
            } else {
                await Usuario.create({
                    nombre: usuario.nombre,
                    correo: usuario.correo,
                    contraseña: hashedPassword,
                    telefono: usuario.telefono,
                    puesto: usuario.puesto,
                    rol: usuario.rol,
                    empresa: new mongoose.Types.ObjectId(usuario.empresa),
                    gruposDeAtencion: usuario.gruposDeAtencion,
                    permisos: usuario.permisos,
                    activo: true,
                    estado_actividad: 'offline',
                    fotoPerfil: '',
                    habilidades: []
                });
                created++;
                console.log(`✨ Creado: ${usuario.nombre} (${usuario.correo})`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`✅ Seed completado exitosamente`);
        console.log(`   👤 Usuarios creados: ${created}`);
        console.log(`   📝 Usuarios actualizados: ${updated}`);
        console.log(`   📦 Total: ${created + updated}`);
        console.log('\n📧 Credenciales de acceso:');
        console.log('   Password para todos: Aurontek2024!');
        console.log('='.repeat(60));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error en seed:', error);
        process.exit(1);
    }
}

seed();
