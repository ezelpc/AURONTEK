import { ConsumeMessage } from 'amqplib';
import { sendTicketNotification } from '../Services/notification.service.js';

export const handleTicketEvent = async (msg: ConsumeMessage) => {
    const data = JSON.parse(msg.content.toString());
    await sendTicketNotification(data);
};