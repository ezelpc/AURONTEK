/**
 * Tipos para el sistema de notificaciones
 */

export interface Notification {
    _id: string;
    usuarioId: string;
    titulo: string;
    mensaje: string;
    tipo: 'info' | 'warning' | 'success' | 'error';
    leida: boolean;
    link?: string;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface NotificationPayload {
    usuarioId: string;
    titulo: string;
    mensaje: string;
    tipo?: 'info' | 'warning' | 'success' | 'error';
    metadata?: Record<string, any>;
    link?: string;
}

export interface NotificationResponse {
    msg: string;
    notificacion?: Notification;
    count?: number;
    notificaciones?: Notification[];
}

export interface EmailPayload {
    to: string;
    subject: string;
    html?: string;
    text?: string;
}

export interface NotificationStats {
    total: number;
    unread: number;
    byType: {
        success: number;
        warning: number;
        error: number;
        info: number;
    };
}

export const NOTIFICATION_TYPES = {
    INFO: 'info' as const,
    WARNING: 'warning' as const,
    SUCCESS: 'success' as const,
    ERROR: 'error' as const,
} as const;

export const NOTIFICATION_ICONS = {
    info: '📋',
    warning: '⚠️',
    success: '✅',
    error: '❌',
} as const;

export const NOTIFICATION_COLORS = {
    info: {
        bg: 'bg-blue-50',
        hover: 'hover:bg-blue-100',
        border: 'border-blue-200',
        text: 'text-blue-900',
        icon: 'text-blue-600'
    },
    warning: {
        bg: 'bg-yellow-50',
        hover: 'hover:bg-yellow-100',
        border: 'border-yellow-200',
        text: 'text-yellow-900',
        icon: 'text-yellow-600'
    },
    success: {
        bg: 'bg-green-50',
        hover: 'hover:bg-green-100',
        border: 'border-green-200',
        text: 'text-green-900',
        icon: 'text-green-600'
    },
    error: {
        bg: 'bg-red-50',
        hover: 'hover:bg-red-100',
        border: 'border-red-200',
        text: 'text-red-900',
        icon: 'text-red-600'
    }
} as const;
