import axios from 'axios';

/**
 * Servicio para enviar notificaciones del sistema
 * Comunica con notificaciones-svc para crear notificaciones y enviar emails
 */

interface NotificationPayload {
    usuarioId: string;
    titulo: string;
    mensaje: string;
    tipo: 'info' | 'warning' | 'success' | 'error';
    metadata?: any;
    link?: string;
}

interface EmailPayload {
    to: string;
    subject: string;
    html?: string;
    text?: string;
}

const NOTIFICACIONES_SVC_URL = process.env.NOTIFICACIONES_SVC_URL || 'http://localhost:3004/api/notificaciones';
const SERVICE_TOKEN = process.env.SERVICE_TOKEN || 'desarrollo';

/**
 * Crear notificación en el sistema
 */
export async function crearNotificacion(payload: NotificationPayload): Promise<void> {
    try {
        // Las notificaciones se crean mediante un evento de RabbitMQ que procesa notificaciones-svc
        // O podemos hacer una llamada directa al endpoint

        console.log('📬 Creando notificación:', {
            usuarioId: payload.usuarioId,
            titulo: payload.titulo,
            tipo: payload.tipo
        });

        // Hacer llamada al servicio de notificaciones - POST a /api/notificaciones/crear
        await axios.post(
            `${NOTIFICACIONES_SVC_URL}`,
            {
                usuarioId: payload.usuarioId,
                titulo: payload.titulo,
                mensaje: payload.mensaje,
                tipo: payload.tipo,
                metadata: payload.metadata,
                link: payload.link
            },
            {
                headers: {
                    'Authorization': `Bearer ${SERVICE_TOKEN}`,
                    'X-Service-Name': 'tickets-svc',
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            }
        );

        console.log('✅ Notificación creada exitosamente');
    } catch (error: any) {
        // Log pero no fallar el flujo principal
        console.warn('⚠️  Error creando notificación:', {
            usuarioId: payload.usuarioId,
            error: error.message,
            status: error.response?.status
        });
    }
}

/**
 * Enviar email de sistema
 */
export async function enviarEmail(payload: EmailPayload): Promise<void> {
    try {
        console.log('📧 Enviando email a:', payload.to);

        await axios.post(
            `${NOTIFICACIONES_SVC_URL}/system-email`,
            {
                to: payload.to,
                subject: payload.subject,
                html: payload.html,
                text: payload.text
            },
            {
                headers: {
                    'Authorization': `Bearer ${SERVICE_TOKEN}`,
                    'X-Service-Name': 'tickets-svc',
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        console.log('✅ Email enviado exitosamente a:', payload.to);
    } catch (error: any) {
        // Log pero no fallar el flujo principal
        console.warn('⚠️  Error enviando email:', {
            to: payload.to,
            error: error.message,
            status: error.response?.status
        });
    }
}

/**
 * Notificación de nuevo ticket creado
 */
export async function notificarTicketCreado(
    ticketId: string,
    ticketTitulo: string,
    usuarioCreadorId: string,
    usuarioCreadorEmail: string,
    usuarioCreadorNombre: string,
    empresaId: string
): Promise<void> {
    try {
        // Notificación en sistema
        await crearNotificacion({
            usuarioId: usuarioCreadorId,
            titulo: '✅ Ticket creado',
            mensaje: `Tu ticket "${ticketTitulo}" ha sido creado exitosamente.`,
            tipo: 'success',
            metadata: { ticketId, empresaId },
            link: `/empresa/tickets/${ticketId}`
        });

        // Email al creador
        await enviarEmail({
            to: usuarioCreadorEmail,
            subject: `Nuevo Ticket Creado: ${ticketTitulo}`,
            html: `
                <h2>¡Hola ${usuarioCreadorNombre}!</h2>
                <p>Tu ticket ha sido creado exitosamente.</p>
                <p><strong>Título:</strong> ${ticketTitulo}</p>
                <p><strong>ID:</strong> ${ticketId}</p>
                <p>Puedes ver el estado del ticket en el portal.</p>
                <p>Gracias por usar nuestro sistema.</p>
            `,
            text: `Tu ticket "${ticketTitulo}" ha sido creado. ID: ${ticketId}`
        });
    } catch (error) {
        console.error('Error notificando ticket creado:', error);
    }
}

/**
 * Notificación de ticket asignado
 */
export async function notificarTicketAsignado(
    ticketId: string,
    ticketTitulo: string,
    agenteId: string,
    agenteEmail: string,
    agentNombre: string,
    creadorNombre: string,
    creadorEmail: string,
    empresaId: string
): Promise<void> {
    try {
        // Notificación al agente asignado
        await crearNotificacion({
            usuarioId: agenteId,
            titulo: '🎫 Nuevo ticket asignado',
            mensaje: `Se te ha asignado el ticket "${ticketTitulo}" creado por ${creadorNombre}.`,
            tipo: 'info',
            metadata: { ticketId, empresaId },
            link: `/empresa/tickets/${ticketId}`
        });

        // Email al agente
        await enviarEmail({
            to: agenteEmail,
            subject: `Nuevo Ticket Asignado: ${ticketTitulo}`,
            html: `
                <h2>¡Hola ${agentNombre}!</h2>
                <p>Se te ha asignado un nuevo ticket.</p>
                <p><strong>Título:</strong> ${ticketTitulo}</p>
                <p><strong>Creado por:</strong> ${creadorNombre}</p>
                <p><strong>ID:</strong> ${ticketId}</p>
                <p>Por favor revisa el ticket en el portal lo antes posible.</p>
            `,
            text: `Nuevo ticket asignado: ${ticketTitulo} (ID: ${ticketId}) por ${creadorNombre}`
        });

        // Notificación al creador del ticket (si es diferente al agente)
        if (creadorEmail !== agenteEmail) {
            await crearNotificacion({
                usuarioId: usuarioCreadorId,
                titulo: '📋 Tu ticket ha sido asignado',
                mensaje: `Tu ticket "${ticketTitulo}" ha sido asignado a ${agentNombre}.`,
                tipo: 'info',
                metadata: { ticketId, empresaId },
                link: `/empresa/tickets/${ticketId}`
            });

            // Email al creador
            await enviarEmail({
                to: creadorEmail,
                subject: `Tu Ticket Ha Sido Asignado: ${ticketTitulo}`,
                html: `
                    <h2>¡Hola ${creadorNombre}!</h2>
                    <p>Tu ticket ha sido asignado.</p>
                    <p><strong>Título:</strong> ${ticketTitulo}</p>
                    <p><strong>Asignado a:</strong> ${agentNombre}</p>
                    <p>El equipo de soporte está trabajando en tu solicitud.</p>
                `,
                text: `Tu ticket "${ticketTitulo}" ha sido asignado a ${agentNombre}`
            });
        }
    } catch (error) {
        console.error('Error notificando ticket asignado:', error);
    }
}

/**
 * Notificación de cambio de estado de ticket
 */
export async function notificarCambioEstado(
    ticketId: string,
    ticketTitulo: string,
    nuevoEstado: string,
    usuarioId: string,
    usuarioEmail: string,
    usuarioNombre: string,
    empresaId: string
): Promise<void> {
    try {
        const estadoEmoji = {
            'abierto': '🔴',
            'en_proceso': '🟡',
            'en proceso': '🟡',
            'cerrado': '✅',
            'resuelto': '✅'
        }[nuevoEstado.toLowerCase()] || '📋';

        await crearNotificacion({
            usuarioId,
            titulo: `${estadoEmoji} Cambio de estado`,
            mensaje: `Tu ticket "${ticketTitulo}" ahora está ${nuevoEstado}.`,
            tipo: nuevoEstado.toLowerCase() === 'cerrado' || nuevoEstado.toLowerCase() === 'resuelto' ? 'success' : 'info',
            metadata: { ticketId, empresaId, nuevoEstado },
            link: `/empresa/tickets/${ticketId}`
        });

        await enviarEmail({
            to: usuarioEmail,
            subject: `Ticket Actualizado: ${ticketTitulo}`,
            html: `
                <h2>¡Hola ${usuarioNombre}!</h2>
                <p>Tu ticket ha sido actualizado.</p>
                <p><strong>Título:</strong> ${ticketTitulo}</p>
                <p><strong>Nuevo estado:</strong> ${nuevoEstado}</p>
                <p><strong>ID:</strong> ${ticketId}</p>
            `,
            text: `Tu ticket "${ticketTitulo}" ahora está ${nuevoEstado}`
        });
    } catch (error) {
        console.error('Error notificando cambio de estado:', error);
    }
}

/**
 * Helper para obtener nombre y email de usuario
 */
export async function obtenerInfoUsuario(usuarioId: string): Promise<{ nombre: string; email: string } | null> {
    try {
        const response = await axios.get(
            `${process.env.USUARIOS_SVC_URL}/usuarios/${usuarioId}`,
            {
                headers: {
                    'Authorization': `Bearer ${SERVICE_TOKEN}`,
                    'X-Service-Name': 'tickets-svc'
                },
                timeout: 5000
            }
        );

        return {
            nombre: response.data.nombre || 'Usuario',
            email: response.data.correo || response.data.email || ''
        };
    } catch (error) {
        console.warn('⚠️  Error obteniendo info de usuario:', usuarioId, error);
        return null;
    }
}
