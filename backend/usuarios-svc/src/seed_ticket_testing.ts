import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Usuario from './Models/AltaUsuario.models';
import { Empresa } from './Models/AltaEmpresas.models';

// Configuración de variables de entorno
const ENV = process.env.NODE_ENV || 'development';
if (ENV === 'development') {
    const rootEnvPath = path.resolve(__dirname, '../../../.env');
    const localEnvPath = path.resolve(__dirname, '../.env');
    dotenv.config({ path: rootEnvPath });
    dotenv.config({ path: localEnvPath });
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI no definida');
    process.exit(1);
}

const testUsers = [
    {
        nombre: 'Agente Mesa Servicio',
        correo: 'agente.mesa@aurontek.com',
        contraseña: 'Password123!',
        rol: 'soporte',
        puesto: 'Agente Soporte N1',
        gruposDeAtencion: ['Mesa de Servicio'],
        habilidades: ['Atención al Cliente', 'Windows'],
        activo: true
    },
    {
        nombre: 'Agente Soporte TI',
        correo: 'agente.ti@aurontek.com',
        contraseña: 'Password123!',
        rol: 'soporte',
        puesto: 'Agente Infraestructura',
        gruposDeAtencion: ['Soporte Ti'], // Nota: 'Soporte Ti' exacto como viene en catalogo
        habilidades: ['Redes', 'Hardware'],
        activo: true
    },
    {
        nombre: 'Admin Interno Ticket',
        correo: 'admin.interno.ticket@aurontek.com',
        contraseña: 'Password123!',
        rol: 'admin-interno',
        puesto: 'Gerente TI',
        gruposDeAtencion: ['Mesa de Servicio', 'Soporte Ti'],
        activo: true
    }
];

const seed = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // 1. Buscar empresa Aurontek HQ o usar la primera encontrada
        let empresa = await Empresa.findOne({
            $or: [
                { nombre: { $regex: /Aurontek HQ/i } },
                { nombre: { $regex: /Aurontek/i } }
            ]
        });

        if (!empresa) {
            console.log('⚠️ No se encontró empresa "Aurontek HQ", buscando cualquiera...');
            empresa = await Empresa.findOne({});
        }

        if (!empresa) {
            console.error('❌ No hay empresas en la BD. Crea una empresa primero.');
            process.exit(1);
        }

        console.log(`🏢 Usando empresa: ${empresa.nombre} (${empresa._id})`);

        // 2. Crear/Actualizar Usuarios
        for (const userData of testUsers) {
            const exists = await Usuario.findOne({ correo: userData.correo });

            if (exists) {
                // Actualizar grupos si ya existe
                exists.gruposDeAtencion = userData.gruposDeAtencion;
                exists.rol = userData.rol;
                exists.empresa = empresa._id;
                await exists.save();
                console.log(`🔄 Usuario actualizado: ${userData.correo} [${userData.gruposDeAtencion.join(', ')}]`);
            } else {
                // Crear nuevo
                await Usuario.create({
                    ...userData,
                    empresa: empresa._id
                });
                console.log(`✅ Usuario creado: ${userData.correo} [${userData.gruposDeAtencion.join(', ')}]`);
            }
        }

        console.log('\n🎉 Datos de prueba insertados correctamente.');
        console.log('Credenciales por defecto: Password123!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error en seed:', error);
        process.exit(1);
    }
};

seed();
