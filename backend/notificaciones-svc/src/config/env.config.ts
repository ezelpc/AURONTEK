// config/env.config.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const loadEnv = (customPath?: string) => {
  const envPath = customPath
    ? path.resolve(customPath)
    : path.resolve(__dirname, '../../../../.env'); // AURONTEK/.env

  const result = dotenv.config({ path: envPath });

  if (result.error) {
    console.error(`❌ No se pudo cargar el archivo .env en: ${envPath}`);
    console.error(result.error);
    process.exit(1);
  }

  console.log(`🌱 Variables de entorno cargadas desde: ${envPath}`);
  return result;
};
