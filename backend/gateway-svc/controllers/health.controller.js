import axios from 'axios';
import { logger } from '../middleware/logger.middleware.js';

const checkServiceHealth = async (url) => {
  try {
    // Limpiar la URL y agregar /health
    const cleanUrl = url.replace(/\/$/, '');
    const healthUrl = `${cleanUrl}/health`;
    
    logger.info(`🔍 Verificando salud de: ${healthUrl}`);
    
    const res = await axios.get(healthUrl, { 
      timeout: 3000,
      validateStatus: (status) => status < 500 // Aceptar cualquier código < 500
    });
    
    const isHealthy = res.status === 200 && res.data.status === 'OK';
    
    logger.info(`${isHealthy ? '✅' : '⚠️'} ${healthUrl}: ${res.status} - ${res.data.status || 'N/A'}`);
    
    return {
      healthy: isHealthy,
      status: res.data.status || 'UNKNOWN',
      responseTime: res.headers['x-response-time'] || 'N/A',
      details: res.data
    };
  } catch (err) {
    logger.error(`❌ Health check falló para ${url}: ${err.message}`);
    return {
      healthy: false,
      status: 'DOWN',
      error: err.message,
      code: err.code
    };
  }
};

export const healthCheck = async (req, res) => {
  const services = {
    usuarios: process.env.USUARIOS_SERVICE_URL || 'http://localhost:3001',
    tickets: process.env.TICKETS_SERVICE_URL || 'http://localhost:3002',
    chat: process.env.CHAT_SERVICE_URL || 'http://localhost:3003',
    notificaciones: process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3004'
  };

  const health = { 
    status: 'OK', 
    timestamp: new Date().toISOString(), 
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {} 
  };

  try {
    // Verificar todos los servicios en paralelo
    const checks = await Promise.all(
      Object.entries(services).map(async ([name, url]) => {
        const result = await checkServiceHealth(url);
        return [name, result];
      })
    );

    // Procesar resultados
    checks.forEach(([name, result]) => {
      health.services[name] = {
        status: result.healthy ? 'UP' : 'DOWN',
        timestamp: new Date().toISOString(),
        ...(result.responseTime && { responseTime: result.responseTime }),
        ...(result.error && { error: result.error }),
        ...(result.details && { 
          service: result.details.service,
          mongodb: result.details.mongodb 
        })
      };
    });

    // Determinar estado general
    const allUp = Object.values(health.services).every(s => s.status === 'UP');
    const someDown = Object.values(health.services).some(s => s.status === 'DOWN');
    
    if (allUp) {
      health.status = 'OK';
    } else if (someDown) {
      health.status = 'DEGRADED';
    } else {
      health.status = 'UNKNOWN';
    }

    // Determinar código HTTP
    const statusCode = health.status === 'OK' ? 200 : 503;

    logger.info(`🏥 Health check completado: ${health.status}`);
    return res.status(statusCode).json(health);

  } catch (err) {
    logger.error('💥 Error en healthCheck:', err);
    return res.status(500).json({ 
      status: 'ERROR', 
      error: 'Error al verificar servicios',
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }
};