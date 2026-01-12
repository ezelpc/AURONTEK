import fs from 'fs';
import path from 'path';

export function initLogger() {
  const branch = (process.env.GIT_BRANCH || process.env.BRANCH || process.env.BRANCH_NAME || process.env.NODE_ENV || 'dev').toString();
  const normalized = branch.toLowerCase();
  const isMain = normalized === 'main' || normalized === 'production' || normalized === 'prod';

  // Always log to console in Docker/Production (standard practice)
  const origLog = console.log.bind(console);
  const origInfo = console.info.bind(console);
  const origWarn = console.warn.bind(console);
  const origError = console.error.bind(console);

  const prefix = `[${normalized}]`;
  console.log = (...args: any[]) => origLog(prefix, ...args);
  console.info = (...args: any[]) => origInfo(prefix, ...args);
  console.warn = (...args: any[]) => origWarn(prefix, ...args);
  console.error = (...args: any[]) => origError(prefix, ...args);
  console.debug = (...args: any[]) => origLog(prefix, '[DEBUG]', ...args);
  return;

  const write = (level: string, args: any[]) => {
    try {
      const message = args.map(a => {
        if (typeof a === 'string') return a;
        try { return JSON.stringify(a); } catch { return String(a); }
      }).join(' ');
      const line = `${new Date().toISOString()} [${level}] ${message}\n`;
      fs.appendFileSync(logFile, line, { mode: 0o600 });
    } catch (e) {
      process.stderr.write(`Logger write error: ${e}\n`);
    }
  };

  console.log = (...args: any[]) => write('INFO', args);
  console.info = (...args: any[]) => write('INFO', args);
  console.warn = (...args: any[]) => write('WARN', args);
  console.error = (...args: any[]) => write('ERROR', args);
  console.debug = (...args: any[]) => write('DEBUG', args);
}
