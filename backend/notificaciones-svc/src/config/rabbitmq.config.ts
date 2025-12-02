import amqplib from 'amqplib';
import { logger } from '../utils/logger';

let connection: any = null;
let channel: any = null;

export const connectRabbitMQ = async (): Promise<void> => {
  try {
    connection = await amqplib.connect(process.env.RABBITMQ_URL as string);
    channel = await connection.createChannel();
    logger.info('🐰 Conectado a RabbitMQ');
  } catch (err) {
    logger.error('❌ Error conectando a RabbitMQ', err);
    throw err;
  }
};

export const getChannel = (): any => channel;