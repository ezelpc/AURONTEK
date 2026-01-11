import { ConsumeMessage } from 'amqplib';
import { sendTicketNotification } from '../Services/notification.service';
import Notificacion from '../Models/Notificacion';
import { redisPubClient } from '../config/redis';

export const handleTicketEvent = async (msg: ConsumeMessage) => {
    const data = JSON.parse(msg.content.toString());
    const routingKey = msg.fields.routingKey;

    console.log(`📨 Evento recibido: ${routingKey}`, JSON.stringify(data, null, 2));

    // 1. Notificación de Creación de Ticket
    if (routingKey === 'ticket.creado') {
        console.log('✅ Procesando ticket.creado');

        // Email al creador
        if (data.ticket?.usuarioCreadorEmail) {
            await sendTicketNotification({
                email: data.ticket.usuarioCreadorEmail,
                ticketId: data.ticket.id,
                mensaje: `Tu ticket "${data.ticket.titulo}" ha sido creado exitosamente.`
            });
        }

        // Notificación en plataforma al creador
        if (data.ticket?.usuarioCreador) {
            await saveWebNotification(
                data.ticket.usuarioCreador,
                `Nuevo Ticket #${data.ticket.id}`,
                `Se ha creado el ticket "${data.ticket.titulo}" exitosamente.`,
                data.ticket.id
            );
        }
    }

    // 2. Notificación de Asignación Manual
    else if (routingKey === 'ticket.asignado') {
        console.log('✅ Procesando ticket.asignado');

        const agenteId = data.ticket?.agenteId || data.ticket?.agenteAsignado;

        if (agenteId) {
            // Notificación en plataforma al agente
            await saveWebNotification(
                agenteId,
                `Ticket Asignado #${data.ticket.id}`,
                `Se te ha asignado el ticket "${data.ticket.titulo}".`,
                data.ticket.id
            );

            // TODO: Obtener email del agente y enviar correo
            console.log(`📧 Debería enviar email al agente ${agenteId}`);
        }
    }

    // 3. Notificación de Asignación Automática (IA)
    else if (routingKey === 'ticket.asignado_automaticamente') {
        console.log('✅ Procesando ticket.asignado_automaticamente');

        const agenteId = data.ticket?.agenteId || data.ticket?.agenteAsignado;

        if (agenteId) {
            // Notificación en plataforma al agente
            await saveWebNotification(
                agenteId,
                `Nuevo Ticket Asignado #${data.ticket.id}`,
                `La IA te ha asignado el ticket "${data.ticket.titulo}".`,
                data.ticket.id
            );

            console.log(`📧 Debería enviar email al agente ${agenteId}`);
        }
    }

    // 4. Notificación de Cambio de Estado
    else if (routingKey === 'ticket.estado_actualizado') {
        console.log('✅ Procesando ticket.estado_actualizado');

        const estado = data.ticket?.estado?.toUpperCase().replace('_', ' ') || 'DESCONOCIDO';
        const comentario = data.comentario || data.ticket?.comentario || '';
        const ticketId = data.ticket?.id || data.ticketId;

        // Mensaje con comentario si existe
        let mensajeEstado = `El estado de tu ticket ha cambiado a: ${estado}`;
        if (comentario) {
            mensajeEstado += `\n\nMotivo: ${comentario}`;
        }

        // Email al creador
        if (data.ticket?.usuarioCreadorEmail) {
            await sendTicketNotification({
                email: data.ticket.usuarioCreadorEmail,
                ticketId: ticketId,
                mensaje: mensajeEstado
            });
        }

        // Notificación en plataforma al creador
        if (data.ticket?.usuarioCreador) {
            await saveWebNotification(
                data.ticket.usuarioCreador,
                `Actualización de Ticket #${ticketId}`,
                mensajeEstado,
                ticketId
            );
        }

        // TAMBIÉN notificar al agente asignado (si es diferente del creador)
        const agenteId = data.ticket?.agenteAsignado?._id || data.ticket?.agenteAsignado;
        if (agenteId && agenteId !== data.ticket?.usuarioCreador) {
            await saveWebNotification(
                agenteId,
                `Cambio de Estado #${ticketId}`,
                `El ticket cambió a: ${estado}` + (comentario ? `\n\nMotivo: ${comentario}` : ''),
                ticketId
            );
        }
    }

    // 5. Notificación de Delegación
    else if (routingKey === 'ticket.delegado') {
        console.log('✅ Procesando ticket.delegado');

        const becarioId = data.ticket?.becarioId;
        const tutorId = data.ticket?.tutorId;
        const ticketId = data.ticket?.id;

        // Notificar al becario
        if (becarioId) {
            await saveWebNotification(
                becarioId,
                `Ticket Delegado #${ticketId}`,
                `Se te ha delegado un ticket. Consulta con tu tutor si tienes dudas.`,
                ticketId
            );
        }

        // Notificar al tutor
        if (tutorId) {
            await saveWebNotification(
                tutorId,
                `Delegación Exitosa #${ticketId}`,
                `Has delegado el ticket a un becario.`,
                ticketId
            );
        }
    }

    // Log para eventos no manejados
    else {
        console.log(`⚠️ Evento no manejado: ${routingKey}`);
    }
};

const saveWebNotification = async (userId: string, titulo: string, mensaje: string, ticketId: string) => {
    try {
        console.log(`💾 Guardando notificación para usuario: ${userId}`);

        const notificacion = await Notificacion.create({
            usuarioId: userId,
            titulo,
            mensaje,
            tipo: 'success',
            metadata: { ticketId }
        });

        console.log(`✅ Notificación guardada: ${notificacion._id}`);

        // Redis Publish para WebSocket
        if (redisPubClient && redisPubClient.isOpen) {
            await redisPubClient.publish('notifications', JSON.stringify({
                targetUserId: userId,
                ...notificacion.toObject()
            }));
            console.log(`📡 Publicado en Redis para usuario ${userId}`);
        } else {
            console.warn('⚠️ Redis no está conectado, notificación en tiempo real no enviada');
        }
    } catch (error) {
        console.error('❌ Error guardando notificación:', error);
    }
};