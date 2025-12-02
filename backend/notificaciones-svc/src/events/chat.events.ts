import { ConsumeMessage } from 'amqplib';
import { sendChatNotification } from '../Services/notification.service';

export const handleChatEvent = async (msg: ConsumeMessage) => {
    const data = JSON.parse(msg.content.toString());
    await sendChatNotification(data);
};