import amqplib from 'amqplib';

let connection: any = null;
let channel: any = null;

export const connectRabbitMQ = async (): Promise<void> => {
  try {
    connection = await amqplib.connect(process.env.RABBITMQ_URL as string);
    channel = await connection.createChannel();
    console.log('🐰 Conectado a RabbitMQ');
  } catch (err) {
    console.error('❌ Error conectando a RabbitMQ', err);
    throw err;
  }
};

export const getChannel = (): any => channel;