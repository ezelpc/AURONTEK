/**
 * Tipos para el sistema de notificaciones
 */

export type NotificationType = 'info' | 'warning' | 'success' | 'error';

export interface Notification {
    _id: string;
    usuarioId: string;
    titulo: string;
    mensaje: string;
    tipo: NotificationType;
    leida: boolean;
    link?: string;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt?: string;
}

export interface CreateNotificationPayload {
    usuarioId: string;
    titulo: string;
    mensaje: string;
    tipo: NotificationType;
    metadata?: Record<string, any>;
    link?: string;
}

export interface NotificationResponse {
    msg: string;
    notificacion?: Notification;
    count?: number;
    eliminadas?: number;
}

export interface EmailPayload {
    to: string;
    subject: string;
    html?: string;
    text?: string;
}

export interface EmailResponse {
    msg: string;
    to: string;
    subject: string;
}

/**
 * Tipos específicos de notificaciones de dominio
 */

export interface TicketNotificationPayload {
    ticketId: string;
    ticketTitulo: string;
    usuarioId: string;
    usuarioEmail: string;
    usuarioNombre: string;
    empresaId: string;
}

export interface TicketAssignmentNotificationPayload extends TicketNotificationPayload {
    agenteId: string;
    agenteEmail: string;
    agentNombre: string;
    creadorNombre: string;
    creadorEmail: string;
}

export interface PasswordChangeNotificationPayload {
    usuarioId: string;
    usuarioEmail: string;
    usuarioNombre: string;
    empresaId?: string;
}

export interface PasswordResetNotificationPayload {
    usuarioEmail: string;
    usuarioNombre: string;
    resetLink: string;
}

export interface UserCreatedNotificationPayload {
    usuarioId: string;
    usuarioEmail: string;
    usuarioNombre: string;
    empresaNombre: string;
    rolUsuario: string;
}

/**
 * Estados de notificación para UI
 */

export interface NotificationStats {
    total: number;
    unread: number;
    read: number;
}

export interface NotificationFilter {
    tipo?: NotificationType;
    leida?: boolean;
    limit?: number;
    skip?: number;
}
