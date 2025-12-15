import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import Servicio from './Models/Servicio'; // 1. Importamos el modelo centralizado

// Hacemos que la carga del .env sea consistente con index.ts
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const seedCatalogo = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI no está definida en las variables de entorno.');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    const catalogoPath = path.join(__dirname, 'Config', 'catalogo.json');
    const rawData = fs.readFileSync(catalogoPath, 'utf-8');
    const catalogoData = JSON.parse(rawData);

    console.log(`🔄 Procesando ${catalogoData.length} servicios...`);

    console.log('🗑️  Limpiando catálogo existente...');
    await Servicio.deleteMany({});

    console.log('🌱 Insertando nuevo catálogo...');
    await Servicio.insertMany(catalogoData);

    console.log('✅ Catálogo instalado correctamente.');
  } catch (error) {
    console.error('❌ Error al instalar el catálogo:', error);
    process.exit(1);
  } finally {
    // 2. Nos aseguramos de cerrar la conexión al terminar
    await mongoose.disconnect();
    console.log('🔌 Conexión a MongoDB cerrada.');
    process.exit(0);
  }
};

seedCatalogo();