import { ConsumeMessage } from 'amqplib';
import { sendTicketNotification } from '../Services/notification.service';
import Notificacion from '../Models/Notificacion';
import { redisPubClient } from '../config/redis';

export const handleTicketEvent = async (msg: ConsumeMessage) => {
    const data = JSON.parse(msg.content.toString());
    const routingKey = msg.fields.routingKey;

    console.log(`📨 Evento recibido: ${routingKey}`);

    // 1. Notificación de Creación
    if (routingKey === 'ticket.creado') {
        if (data.ticket && data.ticket.usuarioCreadorEmail) {
            await sendTicketNotification({
                email: data.ticket.usuarioCreadorEmail,
                ticketId: data.ticket.id,
                mensaje: `Tu ticket "${data.ticket.titulo}" ha sido creado exitosamente.`
            });
        }

        // Guardar notificación web
        if (data.ticket && data.ticket.usuarioCreador) {
            await saveWebNotification(data.ticket.usuarioCreador,
                `Nuevo Ticket #${data.ticket.id}`,
                `Se ha creado el ticket "${data.ticket.titulo}" exitosamente.`,
                data.ticket.id
            );
        }
    }

    // 2. Notificación de Actualización de Estado
    else if (routingKey === 'ticket.estado_actualizado') {
        const estado = data.ticket.estado?.toUpperCase().replace('_', ' ');

        if (data.ticket && data.ticket.usuarioCreadorEmail) {
            await sendTicketNotification({
                email: data.ticket.usuarioCreadorEmail,
                ticketId: data.ticket.id,
                mensaje: `El estado de tu ticket ha cambiado a: ${estado}`
            });
        }

        if (data.ticket && data.ticket.usuarioCreador) {
            await saveWebNotification(data.ticket.usuarioCreador,
                `Actualización de Ticket #${data.ticket.id}`,
                `El estado de tu ticket ha cambiado a: ${estado}`,
                data.ticket.id
            );
        }
    }
};

const saveWebNotification = async (userId: string, titulo: string, mensaje: string, ticketId: string) => {
    try {
        const notificacion = await Notificacion.create({
            usuarioId: userId,
            titulo,
            mensaje,
            tipo: 'success',
            metadata: { ticketId }
        });

        // Redis Publish
        if (redisPubClient.isOpen) {
            await redisPubClient.publish('notifications', JSON.stringify({
                targetUserId: userId,
                ...notificacion.toObject()
            }));
        }
    } catch (error) {
        console.error('Error guardando notificación:', error);
    }
};