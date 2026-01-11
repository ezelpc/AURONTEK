import axios from 'axios';

/**
 * Servicio para enviar notificaciones de usuarios-svc
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
        console.log('📬 Creando notificación:', {
            usuarioId: payload.usuarioId,
            titulo: payload.titulo,
            tipo: payload.tipo
        });

        await axios.post(
            `${NOTIFICACIONES_SVC_URL}/crear`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${SERVICE_TOKEN}`,
                    'X-Service-Name': 'usuarios-svc',
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            }
        );

        console.log('✅ Notificación creada exitosamente');
    } catch (error: any) {
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
                    'X-Service-Name': 'usuarios-svc',
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        console.log('✅ Email enviado exitosamente a:', payload.to);
    } catch (error: any) {
        console.warn('⚠️  Error enviando email:', {
            to: payload.to,
            error: error.message,
            status: error.response?.status
        });
    }
}

/**
 * Notificación de cambio de contraseña
 */
export async function notificarCambioContraseña(
    usuarioId: string,
    usuarioEmail: string,
    usuarioNombre: string,
    empresaId?: string
): Promise<void> {
    try {
        // Notificación en sistema
        await crearNotificacion({
            usuarioId,
            titulo: '🔐 Contraseña actualizada',
            mensaje: 'Tu contraseña ha sido cambiada exitosamente.',
            tipo: 'info',
            metadata: { empresaId },
            link: '/perfil/seguridad'
        });

        // Email al usuario
        await enviarEmail({
            to: usuarioEmail,
            subject: 'Contraseña Actualizada - Aurontek',
            html: `
                <h2>¡Hola ${usuarioNombre}!</h2>
                <p>Tu contraseña ha sido actualizada exitosamente.</p>
                <p>Si no fuiste tú quien realizó este cambio, contacta inmediatamente al equipo de soporte.</p>
                <p style="color: #999; font-size: 12px; margin-top: 20px;">
                    Este es un email automático. Por favor no respondas directamente.
                </p>
            `,
            text: 'Tu contraseña ha sido actualizada. Si no fuiste tú, contacta al soporte.'
        });
    } catch (error) {
        console.error('Error notificando cambio de contraseña:', error);
    }
}

/**
 * Notificación de intento de restablecimiento de contraseña
 */
export async function notificarSolicitudReset(
    usuarioEmail: string,
    usuarioNombre: string,
    resetLink: string
): Promise<void> {
    try {
        await enviarEmail({
            to: usuarioEmail,
            subject: 'Restablece tu Contraseña - Aurontek',
            html: `
                <h2>¡Hola ${usuarioNombre}!</h2>
                <p>Recibimos una solicitud para restablecer tu contraseña.</p>
                <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
                <p style="margin: 20px 0;">
                    <a href="${resetLink}" 
                       style="background-color: #3b82f6; color: white; padding: 10px 20px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Restablecer Contraseña
                    </a>
                </p>
                <p>Este enlace expirará en 1 hora.</p>
                <p>Si no solicitaste este cambio, ignora este email.</p>
                <p style="color: #999; font-size: 12px; margin-top: 20px;">
                    Este es un email automático. Por favor no respondas directamente.
                </p>
            `,
            text: `Restablece tu contraseña aquí: ${resetLink} (Válido por 1 hora)`
        });

        console.log('✅ Email de restablecimiento enviado a:', usuarioEmail);
    } catch (error) {
        console.error('Error notificando solicitud de reset:', error);
    }
}

/**
 * Notificación de invitación a usuario
 */
export async function notificarInvitacionUsuario(
    usuarioEmail: string,
    usuarioNombre: string,
    empresaNombre: string,
    rolAsignado: string,
    enlaceActivacion: string
): Promise<void> {
    try {
        await crearNotificacion({
            usuarioId: 'invitado',
            titulo: '👋 Bienvenido a Aurontek',
            mensaje: `Has sido invitado a ${empresaNombre} como ${rolAsignado}`,
            tipo: 'info'
        });

        await enviarEmail({
            to: usuarioEmail,
            subject: `¡Bienvenido a ${empresaNombre}! - Aurontek`,
            html: `
                <h2>¡Hola ${usuarioNombre}!</h2>
                <p>¡Bienvenido a ${empresaNombre}!</p>
                <p>Has sido invitado con el rol de <strong>${rolAsignado}</strong>.</p>
                <p>Para activar tu cuenta, haz clic en el siguiente enlace:</p>
                <p style="margin: 20px 0;">
                    <a href="${enlaceActivacion}" 
                       style="background-color: #3b82f6; color: white; padding: 10px 20px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Activar Cuenta
                    </a>
                </p>
                <p>Si tienes preguntas, contacta al administrador de tu empresa.</p>
            `,
            text: `Bienvenido a ${empresaNombre}. Activa tu cuenta aquí: ${enlaceActivacion}`
        });
    } catch (error) {
        console.error('Error notificando invitación de usuario:', error);
    }
}

/**
 * Notificación de cambio de rol
 */
export async function notificarCambioRol(
    usuarioId: string,
    usuarioEmail: string,
    usuarioNombre: string,
    nuevoRol: string,
    empresaNombre: string
): Promise<void> {
    try {
        await crearNotificacion({
            usuarioId,
            titulo: '👔 Tu rol ha cambiado',
            mensaje: `Ahora eres ${nuevoRol} en ${empresaNombre}`,
            tipo: 'warning'
        });

        await enviarEmail({
            to: usuarioEmail,
            subject: `Cambio de Rol - ${empresaNombre}`,
            html: `
                <h2>¡Hola ${usuarioNombre}!</h2>
                <p>Tu rol en ${empresaNombre} ha sido actualizado.</p>
                <p><strong>Nuevo rol:</strong> ${nuevoRol}</p>
                <p>Si tienes preguntas sobre tus nuevas responsabilidades, contacta al administrador.</p>
            `,
            text: `Tu rol en ${empresaNombre} ha cambiado a ${nuevoRol}`
        });
    } catch (error) {
        console.error('Error notificando cambio de rol:', error);
    }
}

/**
 * Notificación de desactivación de cuenta
 */
export async function notificarDesactivacion(
    usuarioEmail: string,
    usuarioNombre: string
): Promise<void> {
    try {
        await enviarEmail({
            to: usuarioEmail,
            subject: 'Cuenta Desactivada - Aurontek',
            html: `
                <h2>¡Hola ${usuarioNombre}!</h2>
                <p>Tu cuenta ha sido desactivada.</p>
                <p>Si crees que esto es un error, contacta al equipo de administración.</p>
                <p style="color: #999; font-size: 12px; margin-top: 20px;">
                    Este es un email automático. Por favor no respondas directamente.
                </p>
            `,
            text: 'Tu cuenta ha sido desactivada'
        });

        console.log('✅ Email de desactivación enviado a:', usuarioEmail);
    } catch (error) {
        console.error('Error notificando desactivación:', error);
    }
}
