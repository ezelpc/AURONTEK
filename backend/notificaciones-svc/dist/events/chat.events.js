import { sendChatNotification } from '../Services/notification.service.js';
export const handleChatEvent = async (msg) => {
    const data = JSON.parse(msg.content.toString());
    await sendChatNotification(data);
};
