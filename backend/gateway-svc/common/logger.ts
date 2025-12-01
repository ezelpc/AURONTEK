import fs from 'fs';
import path from 'path';

/**
 * Inicializa el logger global según la rama/entorno.
 * - En `dev` o `test` (o cualquier rama distinta de `main`) deja los console.* normales
 *   (con un prefijo de rama).
 * - En `main` redirige console.* a un archivo de logs en `LOG_DIR` (por defecto /var/log/aurontek)
 *   creando el directorio y archivo con permisos restrictivos (0700 para dir, 0600 para archivo).
 */
export function initLogger() {
  const branch = (process.env.GIT_BRANCH || process.env.BRANCH || process.env.BRANCH_NAME || process.env.NODE_ENV || 'dev').toString();
  const normalized = branch.toLowerCase();
  const isMain = normalized === 'main' || normalized === 'production' || normalized === 'prod';

  if (!isMain) {
    // En dev/test dejamos console intacto pero añadimos prefijo para rastrear la rama
    const origLog = console.log.bind(console);
    const origInfo = console.info.bind(console);
    const origWarn = console.warn.bind(console);
    const origError = console.error.bind(console);

    const prefix = `[${normalized}]`;
    console.log = (...args: any[]) => origLog(prefix, ...args);
    console.info = (...args: any[]) => origInfo(prefix, ...args);
    console.warn = (...args: any[]) => origWarn(prefix, ...args);
    console.error = (...args: any[]) => origError(prefix, ...args);
    return;
  }

  // En rama main: escribir a archivo con permisos restrictivos
  const logDir = process.env.LOG_DIR || '/var/log/aurontek';
  const logFileName = process.env.LOG_FILE || 'app.log';
  const logFile = path.join(logDir, logFileName);

  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true, mode: 0o700 });
    } else {
      try { fs.chmodSync(logDir, 0o700); } catch (e) { /* ignore */ }
    }

    if (!fs.existsSync(logFile)) {
      const fd = fs.openSync(logFile, 'w', 0o600);
      fs.closeSync(fd);
      try { fs.chmodSync(logFile, 0o600); } catch (e) { /* ignore */ }
    } else {
      try { fs.chmodSync(logFile, 0o600); } catch (e) { /* ignore */ }
    }
  } catch (err) {
    // Si no podemos crear el archivo, caemos a consola para evitar bloquear el arranque.
    console.error('Logger init: no se pudo crear directorio/archivo de log, usando consola.', err);
    return;
  }

  const write = (level: string, args: any[]) => {
    try {
      const message = args.map(a => {
        if (typeof a === 'string') return a;
        try { return JSON.stringify(a); } catch { return String(a); }
      }).join(' ');
      const line = `${new Date().toISOString()} [${level}] ${message}\n`;
      fs.appendFileSync(logFile, line, { mode: 0o600 });
    } catch (e) {
      // último recurso: escribir a stderr
      process.stderr.write(`Logger write error: ${e}\n`);
    }
  };

  console.log = (...args: any[]) => write('INFO', args);
  console.info = (...args: any[]) => write('INFO', args);
  console.warn = (...args: any[]) => write('WARN', args);
  console.error = (...args: any[]) => write('ERROR', args);
  console.debug = (...args: any[]) => write('DEBUG', args);
}

export default { initLogger };
