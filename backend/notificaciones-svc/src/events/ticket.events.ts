import { ConsumeMessage } from 'amqplib';
import { sendTicketNotification } from '../Services/notification.service';
import Notificacion from '../Models/Notificacion';
import { redisPubClient } from '../config/redis';

export const handleTicketEvent = async (msg: ConsumeMessage) => {
    const data = JSON.parse(msg.content.toString());

    // 1. Enviar Email (existente)
    // Nota: sendTicketNotification espera { email, ticketId }. 'data' tiene { ticket: { ... } }
    // Aquí hay un MISMATCH. 'data' no tiene email, tiene data.ticket...
    // Si queremos enviar email, necesitamos el email del usuario.
    // El evento NO trae email. :/
    // Tendríamos que consultar usuarios-svc para obtener el email del usuarioCreador.
    // POR AHORA: Comentamos el envío de email para evitar crash, o lo envolvemos en try/catch silencioso,
    // y nos enfocamos en la notificación web que es lo que pide el usuario.
    // Pero espera, data.ticket sí tiene usuarioCreador (ID).

    // 2. Guardar Notificación Web
    if (data.ticket && data.ticket.usuarioCreador) {
        try {
            const notificacion = await Notificacion.create({
                usuarioId: data.ticket.usuarioCreador,
                titulo: `Nuevo Ticket #${data.ticket.id}`,
                mensaje: `Se ha creado el ticket "${data.ticket.titulo}" exitosamente.`,
                tipo: 'success',
                metadata: { ticketId: data.ticket.id }
            });
            console.log(`💾 Notificación guardada para usuario ${data.ticket.usuarioCreador}`);

            // 🚩 PUBLICAR A REDIS (Chat Service escuchará esto)
            if (redisPubClient.isOpen) {
                await redisPubClient.publish('notifications', JSON.stringify({
                    targetUserId: data.ticket.usuarioCreador,
                    ...notificacion.toObject()
                }));
                console.log(`📡 Notificación publicada a Redis para ${data.ticket.usuarioCreador}`);
            }
        } catch (error) {
            console.error('Error guardando notificación:', error);
        }
    }

    // Intento de envío de email (si data tuviera email, que no tiene)
    // await sendTicketNotification(data); 
};