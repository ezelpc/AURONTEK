import { sendEmail } from './email.service.js';
import { logger } from '../utils/logger.js';
export const sendTicketNotification = async (data) => {
    try {
        const { email, ticketId, mensaje } = data;
        if (!email) {
            throw new Error('Email es requerido');
        }
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            h2 { color: #333; }
            .ticket-id { color: #007bff; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>🎫 Nuevo Ticket Creado</h2>
            <p>Se ha creado un nuevo ticket con los siguientes detalles:</p>
            <p>Ticket ID: <span class="ticket-id">#${ticketId}</span></p>
            <p><strong>Mensaje:</strong></p>
            <p>${mensaje || 'Sin mensaje'}</p>
          </div>
        </body>
      </html>
    `;
        await sendEmail({
            to: email,
            subject: `Nuevo ticket creado - #${ticketId}`,
            html
        });
        logger.info(`✅ Notificación de ticket enviada a ${email}`);
    }
    catch (error) {
        logger.error('❌ Error enviando notificación de ticket:', error);
        throw error;
    }
};
export const sendChatNotification = async (data) => {
    try {
        const { email, mensaje, sender } = data;
        if (!email) {
            throw new Error('Email es requerido');
        }
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            h2 { color: #333; }
            .message { background-color: #f5f5f5; padding: 15px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>💬 Nuevo Mensaje en el Chat</h2>
            ${sender ? `<p><strong>De:</strong> ${sender}</p>` : ''}
            <div class="message">
              <p>${mensaje || 'Sin contenido'}</p>
            </div>
          </div>
        </body>
      </html>
    `;
        await sendEmail({
            to: email,
            subject: 'Nuevo mensaje en chat',
            html
        });
        logger.info(`✅ Notificación de chat enviada a ${email}`);
    }
    catch (error) {
        logger.error('❌ Error enviando notificación de chat:', error);
        throw error;
    }
};
export default {
    sendTicketNotification,
    sendChatNotification
};
