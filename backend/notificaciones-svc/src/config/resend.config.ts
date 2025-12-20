import { Resend } from 'resend';

export let resendClient: Resend | null = null;

export const loadResend = async (): Promise<void> => {
    try {
        const apiKey = process.env.RESEND_API_KEY;

        if (!apiKey) {
            throw new Error('RESEND_API_KEY no está configurado');
        }

        resendClient = new Resend(apiKey);
        console.log('📨 Resend configurado correctamente');
    } catch (err) {
        if (process.env.NODE_ENV === 'production') {
            console.error('❌ Error CRÍTICO al configurar Resend (Producción)', err);
            throw err;
        } else {
            const errorMessage = (err as any).message || 'Error desconocido';
            console.warn('⚠️  ADVERTENCIA: Falló la configuración de Resend. El servicio de notificaciones iniciará sin envío de correos.', errorMessage);
            resendClient = null;
        }
    }
};

export const resendVerify = async (): Promise<void> => {
    if (!resendClient) {
        await loadResend();
    }
};
