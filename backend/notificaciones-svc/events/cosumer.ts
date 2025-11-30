import { getChannel } from '../config/rabbitmq.config.js';
import { handleTicketEvent } from './ticket.events.js';
import { handleChatEvent } from './chat.events.js';
import { logger } from '../utils/logger.js';

// Esperar a que RabbitMQ esté conectado antes de consumir
setTimeout(async () => {
  try {
    const channel = getChannel();
    
    if (!channel) {
      logger.error('❌ Canal de RabbitMQ no disponible');
      return;
    }

    // Cola de tickets
    await channel.assertQueue('ticket_events', { durable: true });
    channel.consume('ticket_events', async (msg) => {
      if (!msg) return;
      
      try {
        await handleTicketEvent(msg);
        channel.ack(msg);
      } catch (error) {
        logger.error('❌ Error procesando ticket event:', error);
        channel.nack(msg, false, false);
      }
    });

    // Cola de chat
    await channel.assertQueue('chat_events', { durable: true });
    channel.consume('chat_events', async (msg) => {
      if (!msg) return;
      
      try {
        await handleChatEvent(msg);
        channel.ack(msg);
      } catch (error) {
        logger.error('❌ Error procesando chat event:', error);
        channel.nack(msg, false, false);
      }
    });

    logger.info('📡 Consumidores de eventos inicializados');
  } catch (error) {
    logger.error('❌ Error inicializando consumidores:', error);
  }
}, 2000);