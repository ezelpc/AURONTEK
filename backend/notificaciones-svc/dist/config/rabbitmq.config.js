import amqplib from 'amqplib';
import { logger } from '../utils/logger.js';
let connection = null;
let channel = null;
export const connectRabbitMQ = async () => {
    try {
        connection = await amqplib.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();
        logger.info('🐰 Conectado a RabbitMQ');
    }
    catch (err) {
        logger.error('❌ Error conectando a RabbitMQ', err);
        throw err;
    }
};
export const getChannel = () => channel;
