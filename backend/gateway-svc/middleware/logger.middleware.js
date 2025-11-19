// gateway-svc/src/middleware/logger.middleware.js
import winston from 'winston';

// Configuración del logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'gateway-svc' },
  transports: [
    // Console transport con colores
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...metadata }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(metadata).length > 0 && metadata.service !== 'gateway-svc') {
            msg += ` ${JSON.stringify(metadata)}`;
          }
          return msg;
        })
      )
    })
  ]
});

// En producción, también guardar en archivos
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({ 
    filename: 'logs/error.log', 
    level: 'error' 
  }));
  logger.add(new winston.transports.File({ 
    filename: 'logs/combined.log' 
  }));
}

// Stream para Morgan
export const winstonStream = {
  write: (message) => logger.info(message.trim())
};

export { logger };