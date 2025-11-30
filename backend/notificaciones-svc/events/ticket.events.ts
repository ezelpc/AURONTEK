import { sendTicketNotification } from '../Services/notification.service.js';


export const handleTicketEvent = async (msg) => {
const data = JSON.parse(msg.content.toString());
await sendTicketNotification(data);
};