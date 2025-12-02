import { ConsumeMessage } from 'amqplib';
import { getChannel } from '../config/rabbitmq.config';
import { handleTicketEvent } from './ticket.events';
import { handleChatEvent } from './chat.events';

// Esperar a que RabbitMQ esté conectado antes de consumir
setTimeout(async () => {
  try {
    const channel: any = getChannel();
    
    if (!channel) {
      console.error('❌ Canal de RabbitMQ no disponible');
      return;
    }

    // Cola de tickets
    await channel.assertQueue('ticket_events', { durable: true });
    channel.consume('ticket_events', async (msg: ConsumeMessage | null) => {
      if (!msg) return;
      
      try {
        await handleTicketEvent(msg);
        channel.ack(msg);
      } catch (error) {
        console.error('❌ Error procesando ticket event:', error);
        channel.nack(msg, false, false);
      }
    });

    // Cola de chat
    await channel.assertQueue('chat_events', { durable: true });
    channel.consume('chat_events', async (msg: ConsumeMessage | null) => {
      if (!msg) return;
      
      try {
        await handleChatEvent(msg);
        channel.ack(msg);
      } catch (error) {
        console.error('❌ Error procesando chat event:', error);
        channel.nack(msg, false, false);
      }
    });

    console.log('📡 Consumidores de eventos inicializados');
  } catch (error) {
    console.error('❌ Error inicializando consumidores:', error);
  }
}, 2000);